export default function aggregate(arr, keys) {
  let map = {}

  for (let x of arr) {
    let k = keys.map(k => x[k]).join(':')

    if (!map[k]) {
      map[k] = { ...x }
      continue
    }

    for (let a of Object.keys(x)) {
      if (!keys.includes(a)) map[k][a] += x[a]
    }
  }

  return Object.values(map)
}
