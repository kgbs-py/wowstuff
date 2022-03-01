import './index.styl'
import Filter from './filter.jsx'
import VDGraph from './vdgraph.jsx'
import Tabs from './tabs.jsx'
import ShipMeta from './shipmeta.jsx'
import Select from './select.jsx'
import RatingC from './rating_cont.jsx'
import RatingD from './rating_date.jsx'
import YTDesc from './ytdesc.jsx'

import React from 'react'
import ReactDOM from 'react-dom'

let data = await (await fetch('dist/data.json')).json()

let div = document.createElement('div')
div.setAttribute('class', 'react-app-wrapper')
document.body.appendChild(div)

let ShipSelect = props => (
  <Select selected={props.val} options={[
    { value: 'all', title: 'All ships' },
    { value: 'Battleship', title: 'Battleships' },
    { value: 'Cruiser', title: 'Cruisers' },
    { value: 'Destroyer', title: 'Destroyers' },
    { value: 'AirCarrier', title: 'Carriers' },
  ]} onChange={props.set} />
)

let SortSelect = props => (
  <Select selected={props.val} options={[
    { value: 'battles', title: 'sort by battles' },
    { value: 'wr', title: 'sort by winrate' },
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
          options={data.playerslist.sort().map(x => ({ value: x, title: x }))}
          onChange={props.set} />
)

let App = () => {
  let checked = {}
  let data1 = Object.entries(Object.values(data.index))
  for (let [ idx, season ] of data1) {
    for (let file of season.files) {
      checked[file.replace(/\.json$/, '')] = (+idx === data1.length - 1)
    }
  }

  let [ val, set ] = React.useState(checked)

  function toggle(...data) {
    let c = { ...val }
    for (let d of data) {
      c[d] = !val[d]
    }
    set(c)
  }

  function filter(data) {
    return data.filter(x => val[x.date])
  }

  let tabs = []

  tabs.push((() => {
    return {
      name: 'Filter',
      href: 'filter',
      app: <Filter key='1' data={data.index} checked={val} toggle={toggle} />
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
            <SortSelect val={valS} set={setS} />
            <ShipSelect val={valC} set={setC} />
          </div>
          <VDGraph data={filterclass(filter(data.our_ships))} sort={valS} axis='ship' title='Our Ships' />
          <VDGraph data={filterclass(filter(data.their_ships))} sort={valS} axis='ship' title='Their Ships' />
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
            <SortSelect val={val} set={set} />
          </div>
          <VDGraph data={filter(data.our_comps)} sort={val} axis='comp' title='Our Comps (CV-BB-CA-DD)' />
          <VDGraph data={filter(data.their_comps)} sort={val} axis='comp' title='Their Comps (CV-BB-CA-DD)' />
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
            <SortSelect val={val} set={set} />
          </div>
          <VDGraph data={filter(data.maps)} sort={val} axis='map' title='Maps' />
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
            <SortSelect val={val} set={set} />
          </div>
          <VDGraph data={filter(data.players)} sort={val} axis='player' title='Stat Shaming' />
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
          { val === 'c' && <RatingC data={data.battles} title='Clan Rating (Continuous)' /> }
          { val === 'd' && <RatingD data={data.rating} title='Clan Rating (Daily)' /> }
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
            <PlayerSelect val={val} set={set} />
            <input type='text' className={(valT.match(/^(\d{1,3}:)?\d{1,8}$/) ? '' : 'is-invalid ') + 'form-control vgselect'} value={valT} onChange={ev => setT(ev.target.value)} onBlur={() => setTstored(valT)} />
          </div>
          <YTDesc data={data.battles} player={val} start={valTstored} title='Youtube Description Generator' />
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
      { tabs.map(tab => tab.href === page && tab.app) }
    </div>
  )
}

ReactDOM.render(<App />, div)
