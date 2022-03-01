import assert from 'assert'
import child_process from 'child_process'
import fs from 'fs/promises'
import ini from 'ini'
import needle from 'needle'
import path from 'path'
import util from 'util'

process.chdir(path.join(path.dirname(process.argv[1]), '..'))

let opts = {
  cookies: {
    wsauth_token: ini.parse(await fs.readFile('./scripts/.tokens', 'utf8')).wsauth_token
  }
}

async function get(team) {
  let result = await needle('get', 'https://clans.worldofwarships.eu/api/ladder/battles/?team=' + team, opts)
  assert.strictEqual(result.statusCode, 200)
  assert.ok(Array.isArray(result.body))
  console.log(`fetched team${team} data, ${result.body.length} entries`)
  return result.body
}

async function fs_exists(filename) {
  try {
    await fs.stat(filename)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
    throw err
  }
}

function sort_object(x) {
  if (x?.constructor !== ({}).constructor) return x;

  return Object.fromEntries(
    Object.entries(x)
      .map(a => [ a[0], sort_object(a[1]) ])
      .sort((a, b) => a[0] > b[0] ? 1 : -1)
  )
}

async function process_data(data, teamid) {
  let team = ({ 1: 'alpha', 2: 'bravo' })[teamid]

  for (let battle of data) {
    let [ , date, time ] = battle.finished_at.match(/^(\d\d\d\d-\d\d-\d\d)T(\d\d:\d\d:\d\d)\+00:00$/)

    let index = []
    let db = {}
    let filename = `${date}.json`
    let key = `${time}-${team}`

    if (await fs_exists('data/0000-index.json')) {
      index = JSON.parse(await fs.readFile('data/0000-index.json'))
    }

    if (await fs_exists('data/' + filename)) {
      db = JSON.parse(await fs.readFile('data/' + filename))
    }

    assert.strictEqual(battle.teams[0].claninfo.tag, 'H-O-E')
    if (db[key]) continue

    for (let teams of battle.teams) {
      for (let players of teams.players) {
        delete players.ship.icons
      }
    }

    console.log(`new battle, ${date} ${time}, ${team}, ${battle.teams[0].result}`)
    db[key] = battle
    await fs.writeFile('data/' + filename, JSON.stringify(sort_object(db), null, 2) + '\n')

    if (!Object.values(index).slice(-1)[0].files.includes(filename)) {
      Object.values(index).slice(-1)[0].files.push(filename)
      Object.values(index).slice(-1)[0].files.sort()
      await fs.writeFile('data/0000-index.json', JSON.stringify(index, null, 2) + '\n')
    }
  }
}

await process_data(await get(1), 1)
await process_data(await get(2), 2)

let pkg = JSON.parse(await fs.readFile('package.json'))
pkg.integrity = (await util.promisify(child_process.exec)('sha1sum data/*json | sha1sum')).stdout.slice(0, 40)
await fs.writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n')
