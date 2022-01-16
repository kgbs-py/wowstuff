const { assert } = window._deps_bridge

function gen_history(datasets, datasets_files) {
  let players = {}
  let maps = {}
  let results = []

  for (let f of datasets) {
    let file = datasets_files[f.file]
    let date = f.date
    let teams = []
    let teamid = 0

    for (let ref of Object.keys(file).sort()) {
      let match = file[ref]
      assert(match.teams[0].result in {victory:1,defeat:1})
      assert(match.teams[0].claninfo.tag === 'H-O-E')

      let players = new Set(match.teams[0].players.map(x=>x.name))

      for (let t of teams) {
        t.matching_player_num = [...players].filter(x => t.players.has(x)).length
      }

      let matched_team = teams.filter(t=>t.matching_player_num>=4)
                              .sort((a,b)=>b.matching_player_num-a.matching_player_num)[0]

      if (!matched_team) {
        teams.push(matched_team = {
          teamid: ++teamid,
          wins: 0,
          losses: 0,
          matches: []
        })
      }

      matched_team.players = players
      matched_team.wins += match.teams[0].result === 'victory' ? 1 : 0
      matched_team.losses += match.teams[0].result === 'defeat' ? 1 : 0
      matched_team.matches.push(match)
    }

    for (let team of teams) {
      //results.push(`${date}: team${team.teamid} - ${team.wins}:${team.losses}`)
      results.push({ date, team, expand: false })
    }
  }

  function redraw() {
    let t = d3.select('.tab-contents')
      .selectAll('.show-history')
      .data(results)
      .enter()
        .append('div')
        .attr('class', 'show-history')

    t.append('div').attr('class', 'show-history-header')
    t.append('table').attr('class', 'show-history-data')

    let div = d3.select('.tab-contents')
      .selectAll('.show-history')
      .data(results)
      .attr('class', 'show-history')
      .on('click', (ev, p) => {
        p.expand = !p.expand
        redraw()
      })

    div.select('.show-history-header')
      .text(p => `${p.date}: team${p.team.teamid} - ${p.team.wins}:${p.team.losses}`)

    let div2 = div.select('table')
      .selectAll('.show-history-cell')
      .data(p => p.expand ? p.team.matches : [])

    function toteam(x) {
      if (x===1) return 'α'
      if (x===2) return 'β'
      return '?'
    }

    function toleague(x) {
      if (x===0) return 'H'
      if (x===1) return 'T'
      if (x===2) return 'S'
      if (x===3) return 'G'
      if (x===4) return 'Q'
      return '???'
    }

    function todivision(x) {
      if (x===1) return '1'
      if (x===2) return '2'
      if (x===3) return '3'
      return '?'
    }

    function toprogress(m, simple) {
      if (simple) {
        return `${toteam(m.team_number)},${toleague(m.league)}${todivision(m.division)}`
      }
      if (m.stage) {
        return `${toteam(m.team_number)},${toleague(m.league)}>${toleague(m.stage.target_league)}${m.stage.progress.map(x=>x[0]==='v'?'+':'-').join('')}`
      } else {
        return `${toteam(m.team_number)},${toleague(m.league)}${todivision(m.division)}+${m.division_rating}`
      }
    }

    let app = div2
      .enter()
      .append('tr')
      .attr('class', 'show-history-cell')

    app.append('td').text(p => `${p.finished_at.slice(11, 19)}`)
    app.append('td').text(p => `${p.teams[0].result}`)
    app.append('td').text(p => `${p.map.name}`)
    app.append('td').text(p => `${p.teams[0].claninfo.tag}`)
    app.append('td').text(p => `${toprogress(p.teams[0])}`)
    app.append('td').text(p => `vs`)
    app.append('td').text(p => `${p.teams[1].claninfo.tag}`)
    app.append('td').text(p => `${toprogress(p.teams[1], 1)}`)

    div2
      .exit()
      .remove('*')
  }

  redraw()
}

export { gen_history }
