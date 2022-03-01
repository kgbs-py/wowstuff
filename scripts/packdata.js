import assert from 'assert'
import fs from 'fs/promises'
import path from 'path'


let functions = []
let playerbyid = null

functions.playerslist = {
  *process(battle) {
    playerbyid ??= {}
    for (let player of battle.teams[0].players) {
      playerbyid[player.spa_id] = player.name
    }
  },
  *aggregate() {
    yield* Object.values(playerbyid)
  }
}

functions.maps = {
  keys: [ 'map' ],
  *process(battle) {
    yield {
      map: battle.map.name,
      v: battle.teams[0].result === 'victory' ? 1 : 0,
      d: battle.teams[0].result === 'victory' ? 0 : 1
    }
  }
}

functions.players = {
  keys: [ 'player' ],
  *process(battle) {
    for (let player of battle.teams[0].players) {
      yield {
        player: playerbyid[player.spa_id],
        v: battle.teams[0].result === 'victory' ? 1 : 0,
        d: battle.teams[0].result === 'victory' ? 0 : 1
      }
    }
  }
}

function normalize(name) {
  return name.replace(/[\[\]]/g, '').replace(/^ARP /, '')
}

function *process_battle_ship(team) {
  let ships = {}
  let shipclasses = {}
  for (let player of team.players) {
    let name = normalize(player.ship.name)
    ships[name] ??= 0
    ships[name]++
    shipclasses[name] = all_ships[player.vehicle_id]?.type
  }

  for (let ship of Object.keys(ships)) {
    yield {
      ship,
      class: shipclasses[ship],
      count: ships[ship],
      v: team.result === 'victory' ? 1 : 0,
      d: team.result === 'victory' ? 0 : 1
    }
  }
}

function *process_battle_comp(team) {
  let counts = { AirCarrier: 0, Battleship: 0, Cruiser: 0, Destroyer: 0 }
  for (let player of team.players) {
    counts[all_ships[player.vehicle_id]?.type]++
  }

  yield {
    comp: Object.values(counts).join('-'),
    v: team.result === 'victory' ? 1 : 0,
    d: team.result === 'victory' ? 0 : 1
  }
}

function get_rating(team) {
  let result = {
    team: team.team_number,
    score: [ team.league, team.division, team.division_rating ]
  }

  if (team.stage) {
    result.stage = [ team.stage.target_league, team.stage.progress.map(x => (x === 'victory' ? 1 : 0)) ]
  }

  return result
}

functions.our_ships = {
  keys: [ 'ship', 'class', 'count' ],
  *process(battle) {
    yield* process_battle_ship(battle.teams[0])
  }
}

functions.their_ships = {
  keys: [ 'ship', 'class', 'count' ],
  *process(battle) {
    yield* process_battle_ship(battle.teams[1])
  }
}

functions.our_comps = {
  keys: [ 'comp' ],
  *process(battle) {
    yield* process_battle_comp(battle.teams[0])
  }
}

functions.their_comps = {
  keys: [ 'comp' ],
  *process(battle) {
    yield* process_battle_comp(battle.teams[1])
  }
}

functions.rating = {
  *process(battle) {
    yield {
      season: battle.season_number,
      team: battle.teams[0].team_number,
      score: [ battle.teams[0].league, battle.teams[0].division, battle.teams[0].division_rating ]
    }
  },
  *aggregate(list) {
    let results = {}
    let dates = new Set()
    let seasons = {}
    for (let { season, date, team, score } of list) {
      seasons[season] ??= { sdate: null, steams: [], edate: null, eteams: [] }
      seasons[season].sdate ??= date
      seasons[season].edate = date
      seasons[season].steams[team] ??= score
      seasons[season].eteams[team] = score
      results[season+':'+date+':'+team] = { season, date, team, score }
      dates.add(season+':'+date)
    }

    for (let season of Object.keys(seasons)) {
      let sdate = new Date(+new Date(seasons[season].sdate) - 24*60*60*1000).toISOString().slice(0,10)
      //let edate = new Date(+new Date(seasons[season].edate) + 24*60*60*1000).toISOString().slice(0,10)
      let edate = seasons[season].edate
      results[season+':'+sdate+':1'] = { season: +season, date: sdate, team: 1, score: seasons[season].steams[1] }
      results[season+':'+sdate+':2'] = { season: +season, date: sdate, team: 2, score: seasons[season].steams[2] }
      results[season+':'+edate+':1'] ??= { season: +season, date: edate, team: 1, score: seasons[season].eteams[1] }
      results[season+':'+edate+':2'] ??= { season: +season, date: edate, team: 2, score: seasons[season].eteams[2] }
      dates.add(season+':'+sdate)
      dates.add(season+':'+edate)
    }

    dates = [...dates].sort()

    let prev
    prev = null
    for (let d of dates) {
      if (!results[d+':1'] && prev) results[d+':1'] = {...prev, date:d.split(':')[1]}
      if (results[d+':1']) prev=results[d+':1']
    }
    prev = null
    for (let d of dates) {
      if (!results[d+':2'] && prev) results[d+':2'] = {...prev, date:d.split(':')[1]}
      if (results[d+':2']) prev=results[d+':2']
    }
    yield* Object.keys(results).sort().map(x=>results[x])
  }
}

functions.battles = {
  *process(battle) {
    yield {
      season:       battle.season_number,
      map:          battle.map.name,
      finished_at:  battle.finished_at,
      result:       battle.teams[0].result === 'victory' ? 'victory' : 'defeat',
      our_players:  battle.teams[0].players.map(x => playerbyid[x.spa_id]),
      our_ships:    battle.teams[0].players.map(x => normalize(x.ship.name)),
      their_ships:  battle.teams[1].players.map(x => normalize(x.ship.name)),
      their_tag:    battle.teams[1].claninfo.tag,
      our_rating:   get_rating(battle.teams[0]),
      their_rating: get_rating(battle.teams[1])
    }
  },
  *aggregate(list) {
    yield* list
  }
}


process.chdir(path.join(path.dirname(process.argv[1]), '..'))

let index = JSON.parse(await fs.readFile('data/0000-index.json'))
let all_ships = JSON.parse(await fs.readFile('data/0000-ships.json'))
let files = await fs.readdir('src')

function aggregate(arr, keys) {
  let map = {}

  for (let x of arr) {
    let k = keys.map(k => x[k]).join(':')

    if (!map[k]) {
      map[k] = x
      continue
    }

    for (let a of Object.keys(x)) {
      if (!keys.includes(a)) map[k][a] += x[a]
    }
  }

  return Object.values(map)
}

let output = { index }

for (let [ name, mod ] of Object.entries(functions)) {
  let results = []

  for (let season of Object.keys(index)) {
    for (let f of index[season].files) {
      let file = JSON.parse(
        await fs.readFile('data/' + f)
      )
      let date = f.replace(/\.json$/, '')

      for (let match of Object.values(file)) {
        assert(match.teams[0].result in { victory: 1, defeat: 1 })
        assert(match.teams[0].claninfo.tag === 'H-O-E')

        for (let res of mod.process(match, { season })) {
          results.push({ date, ...res })
        }
      }
    }
  }

  if (mod.aggregate) {
    output[name] = [ ...mod.aggregate(results) ]
  } else {
    output[name] = aggregate(results, [ 'date', ...mod.keys ])
  }
}

//console.log(JSON.stringify(output, null, 2))
console.log(JSON.stringify(output))
