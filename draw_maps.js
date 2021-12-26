function draw_chart(files, sort_by_perc) {
  let data = {}

  let width = 400
  let height = 400

  function process(data, battle) {
    data[battle.map.name] ??= { v: 0, d: 0 }
    if (battle.teams[0].result === 'victory') {
      data[battle.map.name].v++
    } else {
      data[battle.map.name].d--
    }
  }

  for (let file of files) {
    for (let battle of Object.values(file)) {
      process(data, battle)
    }
  }

  data = Object.entries(data).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => {
    let a_metric = sort_by_perc ? (a.v / (a.v-a.d)) : (a.v-a.d)
    let b_metric = sort_by_perc ? (b.v / (b.v-b.d)) : (b.v-b.d)
    if (a_metric === b_metric) return a.name > b.name ? 1 : -1
    return b_metric - a_metric
  })

  function chart(data) {

    let series = d3.stack()
        .keys(['v', 'd'])
        .order(d3.stackOrderNone)//.sort((a, b) => values[a] - values[b])
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
        .range(["#66c2a5", "#f46d43"])
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
        .text(d => `Maps`)
      .style("font-size", "24px")
      .attr("text-anchor", "middle")
        .attr('x',width/2)
        .attr('y','1em')

      svg.append("text")
        .text(d => `we won on`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
        .attr("transform", "rotate(-90)")
        .attr('x',-(y(0) + y(ymax))/2)
        .attr('y',10)

      svg.append("text")
        .text(d => `we lost on`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
        .attr("transform", "rotate(-90)")
        .attr('x',-(y(0) + y(ymin))/2)
        .attr('y',10)

    svg.append("g")
        .call(yAxis);

    return svg.node();
  }

  let c1 = chart(data)
  document.getElementsByClassName('tab-contents')[0].appendChild(c1)
  c1.style.width = width + 'px'
}

function draw_maps(files, ships) {
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

  function refresh() {
    for (let x of Array.from(document.getElementsByTagName('svg'))) x.remove()
    draw_chart(files, sort_by_perc)
  }

  refresh()
}

export { draw_maps }
