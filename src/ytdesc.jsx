import React from 'react'

await new Promise(resolve => {
  let link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Roboto&display=swap')
  link.onload = resolve
  document.getElementsByTagName('head')[0].appendChild(link)
})

let canvas = document.createElement('canvas')
let ctx = canvas.getContext('2d')
ctx.font = '120px Roboto'

let spw = Object.fromEntries(
  [ '\u2003', '\u2004', '\u2005', '\u2006', '\u200A' ].map(x => [
    x,
    Math.round(ctx.measureText(x).width)
  ])
)

function pad_str(s, n) {
  let max_width = n * ctx.measureText('w').width
  let txt_width = ctx.measureText(s).width
  let diff = max_width - txt_width
  let result = ''

  if (diff < 0) {
    //console.log(s, n)
    return result
  }

  for (let [ s, w ] of Object.entries(spw)) {
    result += s.repeat(Math.floor(diff / w))
    diff -= Math.floor(Math.floor(diff / w) * w)
  }

  return result
}

function pad_end(s1, s2, n) {
  return s1 + s2 + pad_str(s1 + s2, n)
}

function pad_start(s1, s2, n) {
  return s1 + pad_str(s1 + s2, n) + s2
}

function get_text(battles, player, startyttime) {
  startyttime = (startyttime.split(':').reduce((a,b) => a*60 + Number(b), 0) * 60 * 1000) || 0
  console.log(startyttime)

  let lines = []
  let count = 0
  let firstbattle

  for (let battle of battles) {
    let pidx = battle.our_players.indexOf(player)
    if (pidx === -1) continue

    let arr = []
    arr.push(String(++count) + '.')

    function teamnu(x) {
      if (x===1) return 'ₐ'
      if (x===2) return 'ᵦ'
      return '?'
    }

    arr.push(battle.their_tag + teamnu(battle.their_rating.team))
    arr.push(battle.result === 'victory' ? 'W' : 'D')
    arr.push(battle.our_ships[pidx])
    arr.push(battle.map)

    function toleague(x) {
      if (x===0) return 'H'
      if (x===1) return 'T'
      if (x===2) return 'S'
      if (x===3) return 'G'
      if (x===4) return 'Q'
      return '?'
    }

    function todivision(x) {
      if (x===1) return '1'
      if (x===2) return '2'
      if (x===3) return '3'
      return '?'
    }

    function toprogress(m) {
      if (m.stage) {
        return `${toleague(m.score[0])}${toleague(m.stage[0])}${teamnu(m.team)}`
      } else {
        return `${toleague(m.score[0])}${todivision(m.score[1])}${teamnu(m.team)}`
      }
    }

    function timediff(a, b) {
      if (!b) b = a

      let diff = a - b + startyttime
      let h = Math.floor(diff / 60 / 60 / 1000)
      diff -= h * 60 * 60 * 1000
      let m = Math.ceil(diff / 60 / 1000)
      //diff -= m * 60 * 1000
      let s = 0//Math.floor(diff / 1000)

      if (m === 60) {
        m = 0
        h++
      }

      h = h % 10

      return [h,m,s].map(s=>String(s+100).slice(1)).join(':').slice(1)
    }

    arr.push(toprogress(battle.our_rating))
    arr.push(timediff(new Date(battle.finished_at), firstbattle))
    firstbattle ??= new Date(battle.finished_at)

    let line = ''
    let linelen = 0

    for (let [ fn, size ] of [
      [ pad_end, 3 ],
      [ pad_end, 7 ],
      [ pad_end, 3 ],
      [ pad_end, 10 ],
      [ pad_end, 11 ],
      [ pad_end, 4 ],
      [ pad_end, 4 ]
    ]) {
      linelen += size
      line = fn(line, arr.shift(), linelen) + ' '
    }

    lines.push(line.trim())
  }

  return lines.join('\n')
}


export default props => {
  let by_date = {}

  for (let battle of props.data) {
    by_date[battle.date] ??= []
    by_date[battle.date].push(battle)
  }

  return (
    <div className='yt-desc'>
      { Object.keys(by_date).reverse().map(date =>
        <div className='yt-desc-item-wrapper' key={date}>
          <div className='yt-desc-item' key={date}>
            <div className='yt-desc-header'>{ date }</div>
            <pre className='yt-desc-data'>{ get_text(by_date[date], props.player, props.start) }</pre>
          </div>
        </div>
      ) }
    </div>
  )
}
