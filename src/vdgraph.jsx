import React from 'react'
import aggregate from './aggregate.js'

/*export let SortBy = props => {
  let id1 = Math.random().toString('36').slice(2)
  let id2 = Math.random().toString('36').slice(2)

  return (
    <div className='vdgraph-sortby'>
      <div className='form-check'>
        <input className='form-check-input' type='radio' id={id1} checked={props.state === 'battles'} onChange={() => props.set('battles')} />
        <label className='form-check-label' htmlFor={id1}>
          Sort by battles
        </label>
      </div>
      <div className='form-check'>
        <input className='form-check-input' type='radio' id={id2} checked={props.state === 'wr'} onChange={() => props.set('wr')} />
        <label className='form-check-label' htmlFor={id2}>
          Sort by WR
        </label>
      </div>
    </div>
  )
}*/

export default props => {
  let ref = React.useRef()

  React.useEffect(() => {
    let data = aggregate(props.data, [ props.axis ])

    data = data.sort((a, b) => {
      let a_metric = props.sort === 'wr' ? (a.v / (a.v+a.d)) : (a.v+a.d)
      let b_metric = props.sort === 'wr' ? (b.v / (b.v+b.d)) : (b.v+b.d)
      if (a_metric === b_metric) return a[props.axis] > b[props.axis] ? 1 : -1
      return b_metric - a_metric
    })

    Plotly.newPlot(ref.current, [
      {
        name: 'wins',
        x: data.map(x => x[props.axis]),
        y: data.map(x => x.v),
        type: 'bar'
      },
      {
        name: 'losses',
        x: data.map(x => x[props.axis]),
        y: data.map(x => x.d),
        type: 'bar'
      },
    ],
    { barmode: 'group', title: { text: props.title } },
    { responsive: true })
  }, [ props ])

  return (
    <div className='graph' ref={ref} />
  )
}
