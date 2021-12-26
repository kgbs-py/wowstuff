const { assert } = window._deps_bridge
import { draw_comp } from './draw_comp.js'
import { draw_meta } from './draw_meta.js'
import { draw_maps } from './draw_maps.js'

let tabs = [
  { name: 'Dataset', fn: select_dataset },
  { name: 'Steel', fn: show_steel },
  { name: 'Ship Meta', fn: show_meta },
  { name: 'Ship Comp', fn: show_comp },
  { name: 'Maps', fn: show_maps },
  { name: 'History', fn: show_history }
]

for (let tab of tabs) {
  tab.active = document.location.hash.slice(1) === tab.fn.name
}
if (!tabs.filter(x => x.active).length) tabs[0].active = true

d3.select('body').html('')

d3.select('body')
  .append('ul')
    .attr('class', 'nav nav-tabs')

d3.select('body')
  .append('div')
    .attr('class', 'tab-contents')

function draw_tabs() {
  d3.select('ul.nav.nav-tabs')
    .selectAll('li a')
    .data(tabs)
      .classed('active', t => t.active)
      .text(t => t.name)
    .enter()
    .append('li')
      .attr('class', 'nav-item')
      .append('a')
        .attr('class', 'nav-link')
        .attr('href', t => '#' + t.fn.name)
        .classed('active', t => t.active)
        .text(t => t.name)
        .on('click', (ev, t) => {
          for (let tab of tabs) tab.active = tab === t
          draw_tabs()
          t.fn()
        })
}

draw_tabs()

d3.select('.tab-contents').append('p').text('loading...')

let datasets = (await (await fetch('index.json')).json())
  .map(file => ({ date: file.replace(/\.json$/, ''), file: 'data/' + file, checked: true }))

let all_ships = (await (await fetch('ships.json')).json())

let datasets_files = {}

for (let { file } of datasets) {
  datasets_files[file] = await (await fetch(file)).json()
}

tabs.find(t => t.active).fn()

function select_dataset_update() {
  d3.select('.tab-contents .data-all .form-check-input')
    .property('checked', () => datasets.filter(x => !x.checked).length === 0)
    .property('indeterminate', () => {
      return datasets.filter(x => !x.checked).length !== 0
          && datasets.filter(x => x.checked).length !== 0
    })

  let dset = d3.select('.tab-contents')
    .classed('tab-select-dataset', true)
    .selectAll('div.data-item')
    .data(datasets)

  dset.each(function () {
    d3.select(this)
      .select('.form-check-input')
      .property('checked', d => d.checked)
  })

  let div = dset.enter()
      .append('div')
      .attr('class', 'form-check data-item')

  div
    .append('input')
    .attr('class', 'form-check-input')
    .property('checked', d => d.checked)
    .attr('id', d => `dataset-${d.date}-check`)
    .attr('type', 'checkbox')
    .on('change', (ev, d) => {
      d.checked = !d.checked
      select_dataset_update()
    })

  div
    .append('label')
    .attr('class', 'form-check-label')
    .attr('for', d => `dataset-${d.date}-check`)
    .text(d => d.date)
}

function select_dataset() {
  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let div = d3.select('.tab-contents')
    .append('div')
    .attr('class', 'form-check data-all')

  div
    .append('input')
    .attr('class', 'form-check-input')
    .attr('id', d => 'dataset-all-check')
    .attr('type', 'checkbox')
    .on('change', (ev, d) => {
      let checked = d3.select(ev.target).property('checked')
      for (let d of datasets) d.checked = checked
      select_dataset_update()
    })

  div
    .append('label')
    .attr('class', 'form-check-label')
    .attr('for', d => 'dataset-all-check')
    .text('select all')

  select_dataset_update()
}

function show_steel() {
  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let players = {}

  for (let dataset of datasets) {
    for (let match of Object.values(datasets_files[dataset.file])) {
      assert(match.teams[0].result in { victory: 1, defeat: 1 })
      assert(match.teams[0].claninfo.tag === 'H-O-E')

      let victory = match.teams[0].result === 'victory'
      let league = match.teams[0].league

      for (let p of match.teams[0].players) {
        if (!victory) continue
        for (let i = league; i <= 4; i++) {
          players[p.nickname] ??= {}
          players[p.nickname][i] ??= 0
          players[p.nickname][i]++
        }
      }
    }
  }

  let data = Object.entries(players).sort((a, b) => {
    for (let i = 1; i <= 4; i++) {
      if ((a[1][i]||0) > (b[1][i]||0)) return -1
      if ((a[1][i]||0) < (b[1][i]||0)) return 1
    }
    return 0
  })

  d3.select('.tab-contents')
    .append('div')
    .attr('class', 'show-steel-header')
    .text('Reminder: you need 30 battles at a league or higher to get all steel from that league, players with all steel for the league are highlighted green.')

  d3.select('.tab-contents')
    .append('div')
    .attr('class', 'show-steel-header')
    .text("BUG: This counts league as it is at the end of the battle (demotions don't count when they should, promotions do count when they shouldn't).")

  let div = d3.select('.tab-contents')
    .append('div')
    .attr('class', 'show-steel')

  div.append('div').attr('class', 'show-steel-player')
  div.append('div').attr('class', 'show-steel-l1').text('Typhoon')
  div.append('div').attr('class', 'show-steel-l2').text('Storm+')
  div.append('div').attr('class', 'show-steel-l3').text('Gale+')
  div.append('div').attr('class', 'show-steel-l4').text('Squall+')

  div
    .selectAll('.show-steel')
    .data(data)
    .enter()
    .each(function () {
      d3.select(this)
        .append('div')
        .attr('class', 'show-steel-player')
        .text(p => p[0])

      for (let i = 1; i <= 4; i++) {
        d3.select(this)
          .append('div')
          .attr('class', 'show-steel-l' + i)
          .append('span')
          .attr('class', 'show-steel-cell')
          .classed('steel-all', p => p[1][i] >= 30)
          .classed('steel-none', p => !p[1][i])
          .classed('steel-some', p => p[1][i] && p[1][i] < 30)
          //.text(p => p[1][i] && p[1][i] < 30 ? p[1][i] : '')
          .text(p => p[1][i] || '-')
      }
    })
}

function show_meta() {
  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let files = []

  for (let dataset of datasets) {
    if (!dataset.checked) continue
    files.push(datasets_files[dataset.file])
  }

  draw_meta(files, all_ships)
}

function show_comp() {
  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let files = []

  for (let dataset of datasets) {
    if (!dataset.checked) continue
    files.push(datasets_files[dataset.file])
  }

  draw_comp(files, all_ships)
}

function show_maps() {
  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let files = []

  for (let dataset of datasets) {
    if (!dataset.checked) continue
    files.push(datasets_files[dataset.file])
  }

  draw_maps(files)
}

function show_history() {
  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let players = {}
  let maps = {}
  let results = []

  for (let f of datasets) {
    let file = datasets_files[f.file]
    let date = f.date
    let teams = []
    let teamid = 0

    for (let ref of Object.keys(file).sort()) {
      let match = file[ref]
      assert(match.teams[0].result in {victory:1,defeat:1})
      assert(match.teams[0].claninfo.tag === 'H-O-E')

      let players = new Set(match.teams[0].players.map(x=>x.name))

      for (let t of teams) {
        t.matching_player_num = [...players].filter(x => t.players.has(x)).length
      }

      let matched_team = teams.filter(t=>t.matching_player_num>=4)
                              .sort((a,b)=>b.matching_player_num-a.matching_player_num)[0]

      if (!matched_team) {
        teams.push(matched_team = {
          teamid: ++teamid,
          wins: 0,
          losses: 0,
          matches: []
        })
      }

      matched_team.players = players
      matched_team.wins += match.teams[0].result === 'victory' ? 1 : 0
      matched_team.losses += match.teams[0].result === 'defeat' ? 1 : 0
      matched_team.matches.push(ref)
    }

    let stat = []

    for (let team of teams) {
      stat.push(`team${team.teamid} - ${team.wins}:${team.losses}`)
    }

    results.push(`${date}: ${stat.join(', ')}`)
  }

  d3.select('.tab-contents')
    .append('pre')
    .attr('class', 'log')
    .text(results.join('\n'))
}
