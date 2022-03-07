import React from 'react'
import aggregate from './aggregate.js'


export default props => {
  let ref = React.useRef()

  React.useEffect(() => {
    let is_sort_wr = props.sort === 'wr'
    let is_percentage = props.mode === 'percentage'
    let data = aggregate(props.data, [ props.axis ])

    data = data.sort((a, b) => {
      let a_metric = is_sort_wr ? (a.v / (a.v+a.d)) : (a.v+a.d)
      let b_metric = is_sort_wr ? (b.v / (b.v+b.d)) : (b.v+b.d)
      if (a_metric === b_metric) return a[props.axis] > b[props.axis] ? 1 : -1
      return b_metric - a_metric
    })

    let wins = {
      name: is_percentage ? 'win %' : 'wins',
      x: [],
      y: [],
      text: [],
      type: 'bar'
    }

    let losses = {
      name: is_percentage ? 'loss %' : 'losses',
      x: [],
      y: [],
      text: [],
      type: 'bar'
    }

    for (let d of data) {
      wins.x.push(d[props.axis])
      losses.x.push(d[props.axis])
      wins.y.push(is_percentage ? (d.v / (d.v + d.d) * 100) : d.v)
      losses.y.push(is_percentage ? (d.d / (d.v + d.d) * 100) : d.d)
      if (is_percentage) wins.text.push(d.v)
      if (is_percentage) losses.text.push(d.d)
    }

    Plotly.newPlot(
      ref.current,
      [ wins, losses ],
      { barmode: is_percentage ? 'stack' : 'group', title: { text: props.title } },
      { responsive: true })
  }, [ props ])

  return (
    <div className='graph' ref={ref} />
  )
}
