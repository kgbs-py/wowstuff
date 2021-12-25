function draw_chart(files, ships, ours, sort_by_perc, types) {
  let data2 = {}
  let series_keys = new Set()

  let width = ours ? 400 : 800
  let height = 600

  function normalize(name) {
    return name.replace(/[\[\]]/g, '').replace(/^ARP /, '')
  }

  function process(where, team) {
    let counts = {}

    for (let player of team.players) {
      if (!types.has(ships[player.vehicle_id].type)) continue
      counts[normalize(ships[player.vehicle_id].name)] ??= 0
      counts[normalize(ships[player.vehicle_id].name)]++
    }

    for (let [ name, count ] of Object.entries(counts)) {
      data2[name] ??= {}
      let vmul = ((team.result === 'victory') ? 1 : -1)
      data2[name][count * vmul] ??= 0
      data2[name][count * vmul] += vmul 
      data2[name].sum ??= 0
      data2[name].sum++
      series_keys.add(count * vmul)
    }
  }

  for (let file of files) {
    for (let battle of Object.values(file)) {
      process(data2, battle.teams[ours ? 0 : 1])
    }
  }

  data2 = Object.entries(data2).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => {
    let a_metric = sort_by_perc ? (Math.abs(a[1]) / (Math.abs(a[1]) + Math.abs(a[-1]))) : a.sum
    let b_metric = sort_by_perc ? (Math.abs(b[1]) / (Math.abs(b[1]) + Math.abs(b[-1]))) : b.sum
    if (a_metric === b_metric) return a.name > b.name ? 1 : -1
    return b_metric - a_metric
  })

  function chart(data) {

    series_keys = Array.from(series_keys).sort((a, b) => {
      if (a > 0 && b < 0) return -1
      if (a < 0 && b > 0) return 1
      return Math.abs(b) - Math.abs(a)
    })

    let series = d3.stack()
        .keys(series_keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetDiverging)
      (data)

    let margin = ({top: 10, right: 10, bottom: 0, left: 40})

    let x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1)

    let ymin = d3.min(series, d => d3.min(d, d => d[0]))
    let ymax = d3.max(series, d => d3.max(d, d => d[1]))

    let y = d3.scaleLinear()
        .domain([ymin, ymax])
        .rangeRound([height - margin.bottom, margin.top])

    let color = d3.scaleOrdinal()
        .domain(series.map(d => d.key))
        //.range(["#d53e4f", "#f46d43", "#fdae61", "#abdda4", "#66c2a5", "#3288bd"])
        .range(ours ? ["#66c2a5", "#f46d43"] : ["#f46d43", "#66c2a5"])
        .unknown("#ccc")

    let xAxis = g => g
        .attr("transform", `translate(0,${y(0)})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        //.call(g => g.selectAll(".tick").attr("transform", name => `translate(${x(name)}, 200)`))
        .call(g => g.selectAll(".domain").remove())
        .selectAll("text")	
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)")

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.selectAll(".domain").remove())

    let formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    svg.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr("x", (d, i) => x(d.data.name))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
      .append("title")
        .text(d => `${d.data.name} ${formatValue(Math.abs(d[1]) + Math.abs(d[0]))}`);

    svg.append("g")
        .call(xAxis);

      svg.append("text")
        .text(d => ours?`Our Ship Choices`:`Enemy Ship Choices`)
      .style("font-size", "24px")
      .attr("text-anchor", "middle")
        .attr('x',width/2)
        .attr('y','1em')

      svg.append("text")
        .text(d => ours?`we won with`:`we lost against`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
        .attr("transform", "rotate(-90)")
        .attr('x',-(y(0) + y(ymax))/2)
        .attr('y',10)

      svg.append("text")
        .text(d => ours?`we lost with`:`we won against`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
        .attr("transform", "rotate(-90)")
        .attr('x',-(y(0) + y(ymin))/2)
        .attr('y',10)

    svg.append("g")
        .call(yAxis);

  /*
                      var fo = svg.append('foreignObject')
                          fo.attr('x',180).attr('y',440).attr('width',1000).attr('height',100)
                      var div = fo.append('xhtml:div')
                          div.html(sw)
                          div.append('div').html('<div style="font: 10px sans-serif">so size-2 dark red bar on the very left means we\'ve lost 2 games to triple Huanghe</div>')
  */

    return svg.node();
  }

  function swatches({
    color,
    columns = null,
    format = x => x,
    swatchSize = 15,
    swatchWidth = swatchSize,
    swatchHeight = swatchSize,
    marginLeft = 0
  }) {
    let id = 'd3sw';

    if (columns !== null) return `<div style="display: flex; align-items: center; margin-left: ${+marginLeft}px; min-height: 33px; font: 10px sans-serif;">
  <style>

.${id}-item {
  break-inside: avoid;
  display: flex;
  align-items: center;
  padding-bottom: 1px;
}

.${id}-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - ${+swatchWidth}px - 0.5em);
}

.${id}-swatch {
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin: 0 0.5em 0 0;
}

  </style>
  <div style="width: 100%; columns: ${columns};">${color.domain().map(value => {
    const label = format(value);
    return `<div class="${id}-item">
      <div class="${id}-swatch" style="background:${color(value)};"></div>
      <div class="${id}-label" title="${label.replace(/["&]/g, entity)}">${label}</div>
    </div>`;
  })}
  </div>
</div>`;

  return `<div style="display: flex; align-items: center; min-height: 33px; margin-left: ${+marginLeft}px; font: 10px sans-serif;">
  <style>

.${id} {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}

.${id}::before {
  content: "";
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin-right: 0.5em;
  background: var(--color);
}

  </style>
  <div>${color.domain().map(value => `<span class="${id}" style="--color: ${color(value)}">${format(value)}</span>`)}</div>`;
  }

  let sw = swatches({
    color: d3.scaleOrdinal(["3x", "2x", "1x", "3x ", "2x ", "1x "], ["#d53e4f", "#f46d43", "#fdae61", "#abdda4", "#66c2a5", "#3288bd"])
  })

  let c1 = chart(data2)
  document.getElementsByClassName('tab-contents')[0].appendChild(c1)
  c1.style.width=width+'px'
}

function draw_meta(files, ships) {
  let sort_by_perc = false, types = new Set()

  d3.select('.tab-contents')
    .attr('class', 'tab-contents')
    .selectAll('*')
    .remove()

  let container = d3.select('.tab-contents')
    .append('div')
    .attr('class', 'cb-controls')

  function add_check(id, text, fn, checked) {
    let div = container
      .append('div')
      .attr('class', 'form-check')

    div
      .append('input')
      .attr('class', 'form-check-input')
      .attr('id', id)
      .attr('type', 'checkbox')
      .property('checked', checked)
      .on('change', fn)

    div
      .append('label')
      .attr('class', 'form-check-label')
      .attr('for', id)
      .text(text)
  }

  add_check('sort-perc', 'sort by percentage', (ev, d) => {
    sort_by_perc = d3.select(ev.target).property('checked')
    refresh()
  }, false)

  for (let type of [ /*'AirCarrier',*/ 'Battleship', 'Cruiser', 'Destroyer' ]) {
    types.add(type)
    add_check('sort-' + type.toLowerCase(), type, (ev, d) => {
      types[d3.select(ev.target).property('checked') ? 'add' : 'delete'](type)
      refresh()
    }, true)
  }

  function refresh() {
    for (let x of Array.from(document.getElementsByTagName('svg'))) x.remove()
    draw_chart(files, ships, false, sort_by_perc, types)
    draw_chart(files, ships, true, sort_by_perc, types)
  }

  refresh()
}

export { draw_meta }
