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
    props.data.dates.forEach(file => checks.push(props.checked[file]))
    ref.current.checked = checked = checks.length && checks.every(x => x)
    ref.current.indeterminate = checks.some(x => x) && checks.some(x => !x)
  }, [ props ])

  function toggleAll(e) {
    let newState = !checked
    let toggles = []
    props.data.dates.forEach(file => {
      if (!!props.checked[file] !== newState) {
        toggles.push(file)
      }
    })
    props.onToggle(...toggles)
  }

  function collapse(ev) {
    if (ev.target.classList.contains('form-check-input')) return
    let el = document.getElementById(`filter-season-${props.data.meta.season}`)

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
        <div className='accordion-button collapsed' data-bs-target={`#filter-season-${props.data.meta.season}`} onClick={collapse}>
          <input className='form-check-input' type='checkbox' ref={ref} onChange={toggleAll} />
          <label className='form-check-label'>{props.label}</label>
        </div>
      </div>
      <div id={`filter-season-${props.data.meta.season}`} className='accordion-collapse collapse'>
        <div className='filter-dates'>
          { props.data.dates.map(file => (
            <FilterDate key={file} data={file} checked={props.checked} onToggle={props.onToggle} />
          )) }
        </div>
      </div>
    </div>
  )
}

let Filter = props => {
  return (
    <div className='filter accordion' id='filter'>
      { props.data.map(dataset => (
        <FilterSeason key={dataset.meta.folder} data={dataset} label={props.index.seasons[dataset.meta.season].title} checked={props.checked} onToggle={props.toggle} />
      )) }
    </div>
  )
}

export default Filter
