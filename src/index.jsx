import './index.styl'
import Filter from './filter.jsx'
import VDGraph from './vdgraph.jsx'
import Tabs from './tabs.jsx'
import ShipMeta from './shipmeta.jsx'
import Select from './select.jsx'
import RatingC from './rating_cont.jsx'
import RatingD from './rating_date.jsx'
import YTDesc from './ytdesc.jsx'
import data_index from '../data/index.json'

import React from 'react'
import ReactDOM from 'react-dom'

let div = document.createElement('div')
div.setAttribute('class', 'react-app-wrapper')

if (document.body) {
  document.body.appendChild(div)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(div)
  })
}

let ClanSelect = props => (
  <Select selected={props.val} options={[
    { value: 'H-O-E', title: 'H-O-E' },
    { value: 'ST0RM', title: 'ST0RM' },
  ]} onChange={props.set} />
)

let ShipSelect = props => (
  <Select selected={props.val} options={[
    { value: 'all', title: 'All ships' },
    { value: 'Battleship', title: 'Battleships' },
    { value: 'Cruiser', title: 'Cruisers' },
    { value: 'Destroyer', title: 'Destroyers' },
    { value: 'AirCarrier', title: 'Carriers' },
  ]} onChange={props.set} />
)

let ModeSelect = props => (
  <Select selected={props.val} options={[
    { value: 'battles', title: 'battles' },
    { value: 'percentage', title: 'winrate' },
  ]} onChange={props.set} />
)

let RatingSelect = props => (
  <Select selected={props.val} options={[
    { value: 'd', title: 'daily' },
    { value: 'c', title: 'all battles' },
  ]} onChange={props.set} />
)

let PlayerSelect = props => (
  <Select selected={props.val}
          options={Array.from(new Set(props.data)).sort().map(x => ({ value: x, title: x }))}
          onChange={props.set} />
)

let App = () => {
  let [ data, setData ] = React.useState([])
  let [ valClan, setClan ] = React.useState(Object.keys(data_index.clans)[0])

  React.useEffect(async () => {
    let datasets = data_index.clans[valClan].seasons.map(s => `dist/data.${s}.${valClan.toLowerCase()}.json`)
    let data = await Promise.all(
      datasets.map(async d => await (await fetch(d)).json())
    )

    /*let new_data = {}
    for (let k of Object.keys(files[0])) {
      new_data[k] = files.map(x => x[k]).flat()
    }*/

    let checked = { ...valFilter }
    let firstset = Object.keys(checked).length === 0

    for (let d of data) {
      for (let date of d.dates) {
        checked[date] ??= false
      }
    }

    if (firstset && data.length) {
      for (let date of data[data.length - 1].dates) {
        checked[date] = true
      }
    }

    setFilter(checked)
    setData(data)
  }, [ valClan ])

  let [ valFilter, setFilter ] = React.useState({})

  function toggle(...data) {
    let c = { ...valFilter }
    for (let d of data) {
      c[d] = !valFilter[d]
    }
    setFilter(c)
  }

  function join(data, field) {
    return data.map(x => x[field]).flat()
  }

  function filter(data, field) {
    return join(data, field).filter(x => valFilter[x.date])
  }

  let tabs = []

  tabs.push((() => {
    let href = 'filter'
    return {
      name: 'Filter',
      href,
      app: (
        <div key={href} className='page-wrapper'>
          <div className='vdgraph-controls'>
            <ClanSelect val={valClan} set={setClan} />
          </div>
          <div>
            <Filter index={data_index} data={data} checked={valFilter} toggle={toggle} />
          </div>
        </div>
      )
    }
  })())

  tabs.push((() => {
    let [ valS, setS ] = React.useState('battles')
    let [ valC, setC ] = React.useState('all')
    let href = 'ships'

    function filterclass(data) {
      if (valC === 'all') return data
      return data.filter(x => x.class === valC)
    }

    return {
      name: 'Ships',
      href,
      app: (
        <div key={href} className='vdgraph-wrapper'>
          <div className='vdgraph-controls'>
            <ModeSelect val={valS} set={setS} />
            <ShipSelect val={valC} set={setC} />
          </div>
          <VDGraph data={filterclass(filter(data, 'our_ships'))} mode={valS === 'percentage' ? 'percentage' : 'battles'} sort={valS === 'percentage' ? 'wr' : 'battles'} axis='ship' title='Our Ships' />
          <VDGraph data={filterclass(filter(data, 'their_ships'))} mode={valS === 'percentage' ? 'percentage' : 'battles'} sort={valS === 'percentage' ? 'wr' : 'battles'} axis='ship' title='Their Ships' />
        </div>
      )
    }
  })())

  tabs.push((() => {
    let [ val, set ] = React.useState('battles')
    let href = 'comps'
    return {
      name: 'Comps',
      href,
      app: (
        <div key={href} className='vdgraph-wrapper'>
          <div className='vdgraph-controls'>
            <ModeSelect val={val} set={set} />
          </div>
          <VDGraph data={filter(data, 'our_comps')} mode={val === 'percentage' ? 'percentage' : 'battles'} sort={val === 'percentage' ? 'wr' : 'battles'} axis='comp' title='Our Comps (CV-BB-CA-DD)' />
          <VDGraph data={filter(data, 'their_comps')}  mode={val === 'percentage' ? 'percentage' : 'battles'} sort={val === 'percentage' ? 'wr' : 'battles'} axis='comp' title='Their Comps (CV-BB-CA-DD)' />
        </div>
      )
    }
  })())

  tabs.push((() => {
    let [ val, set ] = React.useState('battles')
    let href = 'maps'
    return {
      name: 'Maps',
      href,
      app: (
        <div key={href} className='vdgraph-wrapper'>
          <div className='vdgraph-controls'>
            <ModeSelect val={val} set={set} />
          </div>
          <VDGraph data={filter(data, 'maps')} mode={val === 'percentage' ? 'percentage' : 'battles'} sort={val === 'percentage' ? 'wr' : 'battles'} axis='map' title='Maps' />
        </div>
      )
    }
  })())

  tabs.push((() => {
    let [ val, set ] = React.useState('battles')
    let href = 'players'
    return {
      name: 'Players',
      href,
      app: (
        <div key={href} className='vdgraph-wrapper'>
          <div className='vdgraph-controls'>
            <ModeSelect val={val} set={set} />
          </div>
          <VDGraph data={filter(data, 'players')} mode={val === 'percentage' ? 'percentage' : 'battles'} sort={val === 'percentage' ? 'wr' : 'battles'} axis='player' title='Stat Shaming' />
        </div>
      )
    }
  })())

  tabs.push((() => {
    let [ val, set ] = React.useState('d')
    let href = 'rating'
    return {
      name: 'Rating',
      href,
      app: (
        <div key={href} className='vdgraph-wrapper'>
          <div className='vdgraph-controls'>
            <RatingSelect val={val} set={set} />
          </div>
          { val === 'c' && <RatingC data={join(data, 'battles')} title='Clan Rating (Continuous)' /> }
          { val === 'd' && <RatingD data={join(data, 'rating')} title='Clan Rating (Daily)' /> }
        </div>
      )
    }
  })())

  tabs.push((() => {
    let [ val, set ] = React.useState('jayceedee')
    let [ valT, setT ] = React.useState('00:00')
    let [ valTstored, setTstored ] = React.useState(valT)
    let href = 'ytdesc'
    return {
      name: 'YT Desc',
      href,
      app: (
        <div key={href} className='page-wrapper'>
          <div className='vdgraph-controls'>
            <PlayerSelect data={join(data, 'playerslist')} val={val} set={set} />
            <input type='text' className={(valT.match(/^-?(\d{1,3}:)?\d{1,8}$/) ? '' : 'is-invalid ') + 'form-control vgselect'} value={valT} onChange={ev => setT(ev.target.value)} onBlur={() => setTstored(valT)} />
          </div>
          <YTDesc data={join(data, 'battles')} player={val} start={valTstored} title='Youtube Description Generator' />
        </div>
      )
    }
  })())

  let [ page, setPage ] = React.useState(document.location.hash.slice(1) || tabs[0].href)

  function onChange(s) {
    setPage(s)
    document.location.hash = s
  }

  return (
    <div className='react-app'>
      <Tabs tabs={tabs} active={page} onChange={onChange} />
      { data ? tabs.map(tab => tab.href === page && tab.app) : 'Loading...' }
    </div>
  )
}

ReactDOM.render(<App />, div)
