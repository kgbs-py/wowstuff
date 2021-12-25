import fs from 'fs/promises'
import assert from 'assert'

let index = JSON.parse(await fs.readFile('./index.json'))

let players = {}
let maps = {}

for (let f of index) {
  let file = JSON.parse(await fs.readFile('./' + f))
  let date = f.replace(/\.json$/, '')
  let teams = [];
  let teamid = 0;

  for (let ref of Object.keys(file).sort()) {
    let match = file[ref];
    assert(match.teams[0].result in {victory:1,defeat:1})
    assert(match.teams[0].claninfo.tag==='H-O-E')

    let players = new Set(match.teams[0].players.map(x=>x.name));

    for (let t of teams) {
      t.matching_player_num = [...players].filter(x => t.players.has(x)).length;
    }

    let matched_team = teams.filter(t=>t.matching_player_num>=4)
                            .sort((a,b)=>b.matching_player_num-a.matching_player_num)[0];

    if (!matched_team) {
      teams.push(matched_team = {
        teamid: ++teamid,
        wins: 0,
        losses: 0,
        matches: []
      });
    }

    matched_team.players = players;
    matched_team.wins += match.teams[0].result === 'victory' ? 1 : 0;
    matched_team.losses += match.teams[0].result === 'defeat' ? 1 : 0;
    matched_team.matches.push(ref);
  }

  let stat = [];

  for (let team of teams) {
    stat.push(`team${team.teamid} - ${team.wins}:${team.losses}`)
  }

  console.log(`${date}: ${stat.join(', ')}`)
}
