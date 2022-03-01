import React from 'react'
import VDGraph from './vdgraph.jsx'


export default props => {
  return (
    <div className='ship-meta-wrapper'>
      <VDGraph data={props.data_ours} axis='ship' title='Our Ships' />
      <VDGraph data={props.data_theirs} axis='ship' title='Their Ships' />
    </div>
  )
}
