import React from 'react'

export default props => {
  return (
    <select className='form-select vgselect' value={props.selected} onChange={ev => props.onChange(ev.target.value)}>
      { props.options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.title}</option>
      )) }
    </select>
  )
}
