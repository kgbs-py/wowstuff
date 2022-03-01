import Collapse from 'bootstrap/js/dist/collapse.js'
import React from 'react'


let FilterDate = props => {
  let id = Math.random().toString('36').slice(2)

  return (
    <div className='filter-date form-check'>
      <input className='form-check-input' id={id} type='checkbox'
             checked={props.checked[props.data]} onChange={() => props.onToggle(props.data)} />
      <label className='form-check-label' htmlFor={id}>{props.data}</label>
    </div>
  )
}

let FilterSeason = props => {
  let ref = React.useRef()
  let checked

  React.useEffect(() => {
    let checks = []
    props.data.files.forEach(file => checks.push(props.checked[file.replace(/\.json$/, '')]))
    ref.current.checked = checked = checks.length && checks.every(x => x)
    ref.current.indeterminate = checks.some(x => x) && checks.some(x => !x)
  }, [ props ])

  function toggleAll(e) {
    let newState = !checked
    let toggles = []
    props.data.files.forEach(file => {
      if (!!props.checked[file.replace(/\.json$/, '')] !== newState) {
        toggles.push(file.replace(/\.json$/, ''))
      }
    })
    props.onToggle(...toggles)
  }

  function collapse(ev) {
    if (ev.target.classList.contains('form-check-input')) return
    let el = document.getElementById(`filter-season-${props.idx}`)

    if (el.classList.contains('show')) {
      ev.target.classList.add('collapsed')
    } else {
      ev.target.classList.remove('collapsed')
    }

    Collapse.getOrCreateInstance(el, {
      toggle: false
    }).toggle()
  }

  return (
    <div className='filter-season accordion-item'>
      <div className='accordion-header'>
        <div className='accordion-button collapsed' data-bs-target={`#filter-season-${props.idx}`} onClick={collapse}>
          <input className='form-check-input' type='checkbox' ref={ref} onChange={toggleAll} />
          <label className='form-check-label'>{props.label}</label>
        </div>
      </div>
      <div id={`filter-season-${props.idx}`} className='accordion-collapse collapse'>
        <div className='filter-dates'>
          { props.data.files.map(file => (
            <FilterDate key={file} data={file.replace(/\.json$/, '')} checked={props.checked} onToggle={props.onToggle} />
          )) }
        </div>
      </div>
    </div>
  )
}

let Filter = props => {
  return (
    <div className='filter accordion' id='filter'>
      { Object.keys(props.data).map((key, idx) => (
        <FilterSeason key={idx} idx={idx} data={props.data[key]} label={key} checked={props.checked} onToggle={props.toggle} />
      )) }
    </div>
  )
}

export default Filter
