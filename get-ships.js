import assert from 'assert'
import needle from 'needle'
import ini from 'ini'
import fs from 'fs/promises'

let application_id = ini.parse(await fs.readFile('./.tokens', 'utf8')).application_id

async function get(page) {
  let result = await needle('get', 'https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=' + application_id + '&fields=nation%2Ctier%2Ctype%2Cname&page_no=' + page)
  assert.strictEqual(result.statusCode, 200)
  console.log(`fetched page ${page}, ${result.body.meta.count} entries`)
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

async function process(data) {
  let db = {}

  if (await fs_exists('ships.json')) {
    db = JSON.parse(await fs.readFile('ships.json'))
  }

  for (let [ key, value ] of Object.entries(data.data)) {
    if (db[key]) continue
    console.log(`new ship, ${value.name}`)
    db[key] = value
  }

  await fs.writeFile('ships.json', JSON.stringify(sort_object(db), null, 2))
}

let page = await get(1)
await process(page)
for (let i = 2; i <= page.meta.page_total; i++) {
  page = await get(i)
  await process(page)
}
