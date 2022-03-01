import React from 'react'

function get_league_score(score) {
  return ((4 - score[0]) * 3 + 3 - score[1]) * 100 + score[2]
}

function get_date_scaled(season, date, season_starts) {
  let idx = season_starts[season].dates.indexOf(date.slice(0, 10))
  let date_adj = new Date(new Date(date) - 17*60*60*1000 - new Date(date.slice(0, 10)))
  return (season_starts[season].acc_count + Number(idx))*6*60*60*1000 + Number(date_adj)
}

function get_graph(battles) {
  let _season_starts = {}
  for (let battle of battles) {
    _season_starts[battle.season] ??= new Set()
    _season_starts[battle.season].add(battle.finished_at.slice(0, 10))
  }

  let season_starts = {}
  let _acc_count = 0
  for (let s of Object.keys(_season_starts)) {
    season_starts[s] = { acc_count: _acc_count, dates: [ ..._season_starts[s] ] }
    _acc_count += _season_starts[s].size
  }

  let season_start_at = {}
  let season_end_at = {}
  for (let battle of battles) {
    let score = get_league_score(battle.our_rating.score)
    season_start_at[battle.season] ??= {}
    season_end_at[battle.season] ??= {}
    season_start_at[battle.season][battle.our_rating.team] ??= score
    season_end_at[battle.season][battle.our_rating.team] = score
  }

  let last_season = null
  function check_season(new_s) {
    if (last_season === new_s) return

    if (last_season) {
      for (let team of Object.keys(season_start_at[last_season])) {
        let k = `s${last_season}, ${[,'alpha','bravo'][team]}`
        let start = (season_starts[last_season].acc_count+season_starts[last_season].dates.length)*6*60*60*1000-1
        datasets[k].x.push(start)
        datasets[k].y.push(season_end_at[last_season][team])
      }
    }

    if (new_s) {
      for (let team of Object.keys(season_start_at[new_s])) {
        let k = `s${new_s}, ${[,'alpha','bravo'][team]}`
        let start = (season_starts[new_s].acc_count)*6*60*60*1000
        datasets[k] ??= {
          x: [], y: [], mode: 'lines', name: k,
          line: { color: +team === 1 ? '#1f77b4' : '#ff7f0e' }
        }
        datasets[k].x.push(start)
        datasets[k].y.push(season_start_at[new_s][team])
      }
    }

    last_season = new_s
  }

  let datasets = {}
  for (let battle of battles) {
    check_season(battle.season)
    let k = `s${battle.season}, ${[,'alpha','bravo'][battle.our_rating.team]}`
    let score = get_league_score(battle.our_rating.score)
    datasets[k].x.push(get_date_scaled(battle.season, battle.finished_at, season_starts))
    datasets[k].y.push(score)
  }
  check_season(null)

  let xaxis = {
    tickvals: [],
    ticktext: []
  }
  for (let season of Object.keys(season_starts)) {
    for (let [ idx, date ] of Object.entries(season_starts[season].dates)) {
      let start = (season_starts[season].acc_count + Number(idx))*6*60*60*1000
      xaxis.tickvals.push(start)
      xaxis.ticktext.push(date)
    }
  }

  let yaxis = {
    tickvals: [ 0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400 ],
    ticktext: [ 'Squall III', 'Squall II', 'Squall I', 'Gale III', 'Gale II', 'Gale I', 'Storm III', 'Storm II', 'Storm I', 'Typhoon III', 'Typhoon II', 'Typhoon I', 'Hurricane III', 'Hurricane II', 'Hurricane I' ]
  }

  return { datasets, xaxis, yaxis }
}

export default props => {
  let ref = React.useRef()

  React.useEffect(() => {
    let graph = get_graph(props.data)

    Plotly.newPlot(ref.current,
      Object.values(graph.datasets),
      {
        title: { text: props.title },
        xaxis: graph.xaxis,
        yaxis: graph.yaxis
      },
      { responsive: true })
  }, [ props ])

  return (
    <div className='graph' ref={ref} />
  )
}
