import fs from 'fs/promises'
import assert from 'assert'

let index = Object.values(JSON.parse(await fs.readFile('./index.json'))).slice(-1)[0].files
let ships = JSON.parse(await fs.readFile('./ships.json'))
let comps = {}

for (let f of index) {
  let file = JSON.parse(await fs.readFile('./data/' + f))
  let date = f.replace(/\.json$/, '')

  for (let ref of Object.keys(file).sort()) {
    let match = file[ref];
    assert(match.teams[0].result in {victory:1,defeat:1})
    assert(match.teams[0].claninfo.tag==='H-O-E')

    let sh = match.teams[1].players.map(x=>x.vehicle_id).map(s => ships[s]).filter(s => s.type === 'Battleship')
               .map(x=>x.name).sort((a, b) => a > b ? -1 : 1).join(', ');

    comps[sh] ??= { w: 0, l: 0 }
    comps[sh][match.teams[0].result === 'defeat' ? 'w' : 'l']++
  }
}

console.log(Object.entries(comps).sort((a,b) => a[1].w+a[1].l-b[1].w-b[1].l).reverse()
  .map(([k,v]) => `${k}: ${v.w} wins / ${v.l} losses (${(v.w/(v.l+v.w)*100).toFixed(1)}% WR)`).join('\n')
)
