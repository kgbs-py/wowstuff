import fs from 'fs/promises'
import assert from 'assert'

let index = JSON.parse(await fs.readFile('./index.json'))

let players = {}
let maps = {}

for (let f of index) {
  let file = JSON.parse(await fs.readFile('./' + f))
  let date = f.replace(/\.json$/, '')

  for (let match of Object.values(file)) {
    assert(match.teams[0].result in {victory:1,defeat:1})
    assert(match.teams[0].claninfo.tag==='H-O-E')
    let victory = match.teams[0].result === 'victory'
    for (let p of match.teams[0].players) {
      players[date] ??= {}
      players[date][p.nickname] ??= 0
      players[date][p.nickname]++
    }
    let map = match.map.name
    maps[date] ??= {}
    maps[date][map] ??= { v: 0, d: 0 }
    maps[date][map][victory ? 'v' : 'd']++
  }
}

let all_players = new Set(
  Object.values(players).map(Object.keys).flat()
)

let all_maps = new Set(
  Object.values(maps).map(Object.keys).flat()
)

console.log(['player'].concat(Object.keys(players)).join(','))
for (let x of Array.from(all_players).sort()) {
  let arr = [x]
  for (let v of Object.values(players)) arr.push(v[x])
  console.log(arr.join(','))
}

console.log()

console.log([''].concat(Object.keys(maps).map(x=>[x,'']).flat()).join(','))
console.log(['map'].concat(Object.keys(maps).map(x=>['wins','losses']).flat()).join(','))
for (let x of Array.from(all_maps).sort()) {
  let arr = [x]
  for (let v of Object.values(maps)) arr.push(v[x]?.v || '')
  for (let v of Object.values(maps)) arr.push(v[x]?.d || '')
  console.log(arr.join(','))
}
