import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/+esm";

// Visualization 1


const colorScale = d3.scaleOrdinal([
  "#A7CEE3", "#1F78B5", "#B2DF8B", "#33A02D", "#FB9AA0", "#E31A1D", "#FDBF70", "#FF7F01",
  "#CAB2D7", "#6A3D9B", "#FFFF9A", "#9C27B1", "#8DD3C8", "#FFFFB4", "#BEBADA", "#FB8073",
  "#80B1D4", "#FDB463", "#B3DE6A", "#FCCDE6"
]);
const stageDescriptions = {
  0: "ASA Classification",
  1: "Surgery Type",
  2: "ICU Duration",
  3: "Outcome"
};
const asaDescriptions = {
  "ASA 1": "A normal, healthy patient.",
  "ASA 2": "A patient with mild systemic disease (e.g., well-controlled hypertension or diabetes).",
  "ASA 3": "A patient with severe systemic disease that is not life-threatening (e.g., poorly controlled hypertension, morbid obesity).",
  "ASA 4": "A patient with severe systemic disease that is a constant threat to life (e.g., unstable angina, end-stage renal disease).",
  "ASA 5": "A moribund patient who is not expected to survive without the operation.",
  "ASA 6": "A brain-dead patient whose organs are being removed for donation."
};
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "sankey-tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #2C3E50")
  .style("padding", "8px")
  .style("pointer-events", "none")
  .style("opacity", 0);

d3.csv("data/hospital-data.csv").then(function(data) {
  data.forEach(d => {
    const icu = +d.icu_days;
    if (icu === 0) { d.icu_bin = "0 days"; }
    else if (icu >= 1 && icu <= 3) { d.icu_bin = "1-3 days"; }
    else if (icu >= 4) { d.icu_bin = "4+ days"; }
    else { d.icu_bin = "Unknown"; }
    d.outcome = (+d.death_inhosp === 1) ? "Death" : "Survived";
  });

  const nodes = [];
  const nodeMap = {};
  function addNode(stage, name) {
    const key = stage + "_" + name;
    if (!(key in nodeMap)) {
      const node = { name: name, stage: stage };
      nodeMap[key] = nodes.length;
      nodes.push(node);
    }
    return nodeMap[key];
  }
  const linksMap = {};
  function addLink(sourceKey, targetKey, value) {
    const key = sourceKey + "->" + targetKey;
    linksMap[key] = (linksMap[key] || 0) + value;
  }
  data.forEach(d => {
    const asaVal = parseFloat(d.asa);
    if (!isNaN(asaVal)) {
      addNode(0, d.asa);
      addNode(1, d.optype);
      addNode(2, d.icu_bin);
      addNode(3, d.outcome);
      addLink("0_" + d.asa, "1_" + d.optype, 1);
      addLink("1_" + d.optype, "2_" + d.icu_bin, 1);
      addLink("2_" + d.icu_bin, "3_" + d.outcome, 1);
    }
  });
  const links = [];
  for (const key in linksMap) {
    const parts = key.split("->");
    links.push({
      source: nodeMap[parts[0]],
      target: nodeMap[parts[1]],
      value: linksMap[key]
    });
  }
  const container = document.getElementById("sankey-vis");
  const width = container.clientWidth;
  const height = 800;
  const sankeyGenerator = sankey()
    .nodeWidth(20)
    .nodePadding(10)
    .nodeAlign(sankeyLeft)
    .nodeSort((a, b) => {
      if (a.stage === 0 && b.stage === 0) { return parseFloat(a.name) - parseFloat(b.name); }
      return 0;
    })
    .extent([[1, 1], [width - 1, height - 6]]);
  const graph = {
    nodes: nodes.map(d => Object.assign({}, d)),
    links: links.map(d => Object.assign({}, d))
  };
  sankeyGenerator(graph);
  const svg = d3.select("#sankey-vis").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "rgb(245,240,230)")
    .style("border", "2px solid #2C3E50")
    .style("padding", "7px");
  const link = svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .enter().append("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => colorScale(graph.nodes[d.source.index].name))
    .attr("fill", "none")
    .attr("stroke-width", d => Math.max(2, d.width))
    .attr("stroke-opacity", 0.25)
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke-opacity", 0.7);
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`
        <strong>Flow Details:</strong><br>
        From: ${graph.nodes[d.source.index].name}<br>
        To: ${graph.nodes[d.target.index].name}<br>
        Count: ${d.value}
      `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("stroke-opacity", 0.25);
      tooltip.transition().duration(500).style("opacity", 0);
    })
    .on("click", function(event, d) {
      console.log("working", d);
    });
  const node = svg.append("g")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g");
  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => {
      if (d.stage === 3 && d.name === "Death") return "#555555";
      if (d.stage === 3 && d.name === "Survived") return "#f8f8f8";
      return colorScale(d.name);
    })
    .attr("stroke", "#2C3E50")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke", "#2C3E50");
      tooltip.transition().duration(200).style("opacity", 0.9);
      let nodeTotal = d.value;
      if (!nodeTotal) {
        nodeTotal = d3.sum(d.sourceLinks, link => link.value) || d3.sum(d.targetLinks, link => link.value) || 0;
      }
      if (d.stage === 0) {
        let parsedVal = parseFloat(d.name);
        let label = isNaN(parsedVal) ? d.name : "ASA " + parsedVal;
        tooltip.html(`
          <strong>ASA Classification</strong><br>
          ${label}<br>
          Total: ${nodeTotal}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      } else {
        tooltip.html(`
          <strong>${stageDescriptions[d.stage]}</strong><br>
          ${d.name}<br>
          Total: ${nodeTotal}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      }
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke", "#2C3E50");
      tooltip.transition().duration(500).style("opacity", 0);
    });
  node.append("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2 + 5)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .attr("pointer-events", "none")
    .text(d => d.name);
});

// Visualization 2 bar

const marginBar = { top: 20, right: 20, bottom: 60, left: 60 };
const widthBar = 600 - marginBar.left - marginBar.right;
const heightBar = 400 - marginBar.top - marginBar.bottom;
const svgBarChart = d3.select("#BarChart")
  .append("svg")
  .attr("width", widthBar + marginBar.left + marginBar.right)
  .attr("height", heightBar + marginBar.top + marginBar.bottom)
  .append("g")
  .attr("transform", `translate(${marginBar.left},${marginBar.top})`);
const xScale = d3.scaleBand().range([0, widthBar]).padding(0.1);
const yScale = d3.scaleLinear().range([heightBar, 0]);
const xAxisGroup = svgBarChart.append("g")
  .attr("transform", `translate(0, ${heightBar})`);
const yAxisGroup = svgBarChart.append("g");

d3.csv("data/hospital-data.csv").then(data => {
  const departments = Array.from(new Set(data.map(d => d.department))).sort();
  const allTypes = Array.from(new Set(data.map(d => d.optype)));
  const firstDept = departments[0];
  const firstDeptData = data.filter(d => d.department === firstDept);
  const firstDeptCounts = d3.rollup(firstDeptData, v => v.length, d => d.optype);
  const sortedTypes = allTypes.sort((a, b) => {
    const countA = firstDeptCounts.get(a) || 0;
    const countB = firstDeptCounts.get(b) || 0;
    return countB - countA;
  });
  xScale.domain(sortedTypes);
  const maxCountFirstDept = d3.max(Array.from(firstDeptCounts.values()));
  yScale.domain([0, maxCountFirstDept]);
  const deptColor = d3.scaleOrdinal()
    .domain(departments)
    .range(["#a57db5", "#67a3cb", "#64c28c", "#d3766c"]);
  
  xAxisGroup.call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end");
  yAxisGroup.call(d3.axisLeft(yScale));
  
  d3.select("#controls")
    .selectAll("button")
    .data(departments)
    .enter()
    .append("button")
    .attr("class", "dept-btn")
    .attr("data-dept", d => d)
    .style("background-color", d => deptColor(d))
    .style("color", "white")
    .text(d => d)
    .on("click", function(event, d) {
      d3.selectAll(".dept-btn").classed("active", false);
      d3.select(this).classed("active", true);
      updateChart(d, deptColor(d));
    });
  
  function updateChart(selectedDept, color) {
    const filteredData = data.filter(d => d.department === selectedDept);
    const countsMap = d3.rollup(filteredData, v => v.length, d => d.optype);
    const counts = sortedTypes.map(type => [type, countsMap.get(type) || 0]);
    const bars = svgBarChart.selectAll(".bar").data(counts, d => d[0]);
    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d[0]))
      .attr("width", xScale.bandwidth())
      .attr("y", heightBar)
      .attr("height", 0)
      .merge(bars)
      .transition().duration(500)
      .attr("x", d => xScale(d[0]))
      .attr("width", xScale.bandwidth())
      .attr("y", d => heightBar - Math.max(heightBar - yScale(d[1]), 3))
      .attr("height", d => Math.max(heightBar - yScale(d[1]), 3))
      .attr("fill", color);
    bars.exit()
      .transition().duration(500)
      .attr("y", heightBar)
      .attr("height", 0)
      .remove();
    const labels = svgBarChart.selectAll(".label").data(counts, d => d[0]);
    labels.enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => xScale(d[0]) + xScale.bandwidth() / 2)
      .attr("y", heightBar - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#2C3E50")
      .attr("font-weight", d => d[1] !== 0 ? "bold" : "normal")
      .text(d => d[1])
      .merge(labels)
      .transition().duration(500)
      .attr("x", d => xScale(d[0]) + xScale.bandwidth() / 2)
      .attr("y", d => (heightBar - Math.max(heightBar - yScale(d[1]), 3)) - 5)
      .attr("font-weight", d => d[1] !== 0 ? "bold" : "normal")
      .text(d => d[1]);
    labels.exit()
      .transition().duration(500)
      .attr("y", heightBar)
      .remove();
  }
  
  if (departments.length > 0) {
    d3.selectAll(".dept-btn").filter((d, i) => i === 0).classed("active", true);
    updateChart(departments[0], deptColor(departments[0]));
  }
});
