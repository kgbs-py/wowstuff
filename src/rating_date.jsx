import React from 'react'

export default props => {
  let ref = React.useRef()

  React.useEffect(() => {
    let datasets = {}

    for (let { season, date, team, score } of props.data) {
      let k = `s${season}, ${[,'alpha','bravo'][team]}`
      datasets[k] ??= { x: [], y: [], mode: 'lines', name: k, line: { color: team === 1 ? '#1f77b4' : '#ff7f0e' } }
      datasets[k].x.push(date)
      datasets[k].y.push(((4 - score[0]) * 3 + 3 - score[1]) * 100 + score[2])
    }

    Plotly.newPlot(ref.current,
      Object.values(datasets),
      {
        title: { text: props.title },
        xaxis: {
          type: 'category'
        },
        yaxis: {
          tickvals: [ 0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400 ],
          ticktext: [ 'Squall III', 'Squall II', 'Squall I', 'Gale III', 'Gale II', 'Gale I', 'Storm III', 'Storm II', 'Storm I', 'Typhoon III', 'Typhoon II', 'Typhoon I', 'Hurricane III', 'Hurricane II', 'Hurricane I' ]
        },
      },
      { responsive: true })
  }, [ props ])

  return (
    <div className='graph' ref={ref} />
  )
}
