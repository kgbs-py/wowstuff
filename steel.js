import fs from 'fs/promises'
import assert from 'assert'

let index = Object.values(JSON.parse(await fs.readFile('./index.json'))).slice(-1)[0].files

let players = {}

for (let f of index) {
  let file = JSON.parse(await fs.readFile('./data/' + f))
  let date = f.replace(/\.json$/, '')

  for (let match of Object.values(file)) {
    assert(match.teams[0].result in {victory:1,defeat:1})
    assert(match.teams[0].claninfo.tag==='H-O-E')
    let victory = match.teams[0].result === 'victory'
    let league = match.teams[0].league
    for (let p of match.teams[0].players) {
      if (!victory) continue;
      players[p.nickname] ??= {}
      players[p.nickname][league] ??= 0
      players[p.nickname][league]++
    }
  }
}


for (let [k,v] of Object.entries(players).filter(a=>a[1][2]).sort((a,b)=>(b[1][2]||0)-(a[1][2]||0))) {
  console.log(k + ' '.repeat(20-k.length) + ' - ' + ' '.repeat(2-String(v[2]).length) + v[2] + ' / 30')
}
