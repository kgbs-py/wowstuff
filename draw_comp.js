function draw_comp(files, ships) {
  let compositions = {}
  let data1 = { name: 'root', children: [], who: 'we', title: 'hoes' }
  let data2 = { name: 'root', children: [], who: 'they', title: 'foes' }

  function inc_leaf(where, path, value, wins) {
    let d = where
    let p

    for (p of path) {
      d.matches ??= 0
      d.matches += value
      d.wins ??= 0
      d.wins += wins

      d.children ??= []
      let child = d.children.find(x => x.name === p)
      if (!child) {
        child = { name: p }
        d.children.push(child)
      }
      d = child
    }

    d.value ??= 0
    d.value += value
    d.matches ??= 0
    d.matches += value
    d.wins ??= 0
    d.wins += wins
  }

  function process(where, team, battle) {
    let counts = { Battleship: 0, AirCarrier: 0, Destroyer: 0, Cruiser: 0 };
    let comp = []
    for (let player of team.players) {
      counts[ships[player.vehicle_id].type]++
      comp.push(ships[player.vehicle_id].name)
    }

    if (counts.Battleship + counts.AirCarrier !== 2 || counts.Battleship + counts.AirCarrier + counts.Destroyer + counts.Cruiser !== 7) {
      inc_leaf(where, [ 'weirdos', 1 ], battle.teams[1].result === 'victory' ? 1 : 0)
    } else {
      inc_leaf(where, [
        [ '2 BB', 'CV + BB', '2 CV'][counts.AirCarrier],
        counts.Destroyer + ' DD',
        //comp.sort().join(' ')
      ], 1, team.result === 'victory' ? 1 : 0)
    }
  }

  for (let file of files) {
    for (let battle of Object.values(file)) {
      process(data1, battle.teams[0], battle)
      process(data2, battle.teams[1], battle)
    }
  }


  function chart(data) {
    const root = partition(data);

    root.each(d => d.current = d);

    const svg = d3.create('svg')
        .attr('viewBox', [0, 0, width, width])
        .style('font', '10px sans-serif');

    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", width / 2 - 5)
      .style("font-size", "40px")
      .text(data.title);
    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", width / 2 + 25)
      .style("font-size", "20px")
      .text(`${(data.wins / data.matches * 100).toFixed(0)}% WR`);

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${width / 2})`);

    const path = g.append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
        .attr('fill', d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr('fill-opacity', d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr('d', d => arc(d.current));

    g.append("g")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
        .style("font-size", "28px")
        .attr("dy", "-0.25em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .text(d => d.data.name)

    g.append("g")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
        .style("font-size", "14px")
        .attr("dy", "0.85em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .text(d => `${d.data.matches} battles`)

    g.append("g")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
        .style("font-size", "14px")
        .attr("dy", "2em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .text(d => `${data.who} won ${(d.data.wins / d.data.matches * 100).toFixed(0)}%`)

    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    return svg.node();
  }

  let partition = data => {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    return d3.partition()
        .size([2 * Math.PI, root.height + 1])
      (root);
  }

  let color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data2.children.length + 1))

  let format = d3.format(",d")

  let width = 932

  let radius = width / 6

  let arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

  let c1 = chart(data1)
  document.getElementsByClassName('tab-contents')[0].appendChild(c1)
  c1.style.width='400px'
  c1.style.marginRight='20px'

  let c2 = chart(data2)
  document.getElementsByClassName('tab-contents')[0].appendChild(c2)
  c2.style.width='400px'
}

export { draw_comp }
