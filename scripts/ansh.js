// Set up the SVG canvas with increased left margin for y-axis label
const margin = { top: 60, right: 30, bottom: 100, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

const svg = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set up the dropdown filter
const sexDropdown = d3.select("#sex-filter");

// Add resample and reset buttons
d3.select("#scatterplot")
  .insert("button", ":first-child")
  .attr("id", "resample-button")
  .attr("class", "btn")
  .style("margin-bottom", "10px")
  .style("margin-top", "10px")
  .text("Resample Data (75 points)")
  .on("click", resampleData);

d3.select("#scatterplot")
  .insert("button", ":first-child")
  .attr("id", "reset-button")
  .attr("class", "btn")
  .style("margin-bottom", "10px")
  .style("margin-top", "10px")
  .style("margin-right", "10px")
  .text("Show Full Dataset")
  .on("click", resetData);

// Store datasets
let fullData = [];
let sampledData = [];
let currentData = [];
const sampleSize = 75;

// Convert minutes to days function
function minutesToDays(minutes) {
  return minutes / (24 * 60);
}

// Update scatter plot function
function updateScatterPlot(data) {
  currentData = data; // Track the current dataset
  const selectedSex = sexDropdown.property("value");
  const filteredData = data.filter(d => d.sex === selectedSex || selectedSex === "All");

  // Define scales
  const xScale = d3.scaleLinear()
    .domain([d3.min(filteredData, d => d.age) - 5, d3.max(filteredData, d => d.age) + 5])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => minutesToDays(d.opend - d.opstart))])
    .range([height, 0]);

    const colorMap = {
      "Open": "#1f77b4",
      "Videoscopic": "#ff7f0e",
      "Robotic": "#2ca02c"
  };  

  // Clear previous plot
  svg.selectAll("*").remove();

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Relationship Between Patient Age, Surgery Duration, and Approach");

  // Add axes
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale))
      .selectAll("line, path") // Axis lines
      .style("stroke-width", "3px");

  svg.selectAll(".tick text")  // Separate selection for tick labels
      .style("font-size", "14px")
      .style("fill", "black");


  // Add y-axis
  svg.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => d.toFixed(3)))
      .selectAll("line, path") // Axis lines
      .style("stroke-width", "3px");

  // Increase tick label size
  svg.selectAll(".tick text") // Separate selection for tick labels
      .style("font-size", "14px")
      .style("fill", "black");


  // Add axis labels with larger font
  svg.append("text")
    .attr("transform", "translate(" + (width / 2) + "," + (height + 60) + ")")
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Age");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10)
    .attr("x", -(height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Surgery Duration (days)");

  // Scatterplot points
  svg.selectAll("circle")
    .data(filteredData)
    .enter().append("circle")
    .attr("cx", d => xScale(d.age))
    .attr("cy", d => yScale(minutesToDays(d.opend - d.opstart)))
    .attr("r", d => Math.sqrt(d.bmi) * 2)
    .style("fill", d => colorMap[d.approach])
    .style("opacity", 0.7)
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke", "black").style("stroke-width", 2);
      const tooltip = d3.select("#tooltip");
      tooltip.transition().duration(200).style("opacity", .9);
      const durationMinutes = d.opend - d.opstart;
      const durationDays = minutesToDays(durationMinutes).toFixed(3);
      tooltip.html(`Age: ${d.age}<br>Surgery Type: ${d.approach}<br>Duration: ${durationDays} days (${durationMinutes} mins)`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("stroke", "none");
      const tooltip = d3.select("#tooltip");
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

// Resample function
function resampleData() {
  sampledData = d3.shuffle(fullData).slice(0, sampleSize);
  updateScatterPlot(sampledData);
}

// Reset function
function resetData() {
  updateScatterPlot(fullData);
}

// Load data from CSV
d3.csv("data/hospital-data.csv").then(function(data) {
  data.forEach(d => {
    d.age = +d.age;
    d.opstart = +d.opstart;
    d.opend = +d.opend;
    d.bmi = +d.bmi;
  });

  fullData = data;
  sampledData = d3.shuffle(fullData).slice(0, sampleSize);
  currentData = fullData;

  // Default to showing full dataset
  updateScatterPlot(fullData);

  // Update scatterplot when the dropdown filter changes
  sexDropdown.on("change", function() {
    updateScatterPlot(currentData);
  });
});


function createLegend() {
  const legendContainer = d3.select("#legend-container");

  // Clear any existing legend
  legendContainer.html("");

  const approaches = ["Open", "Videoscopic", "Robotic"]; // Replace with actual labels
  const colors = d3.schemeCategory10.slice(0, approaches.length);

  const legend = legendContainer.append("div")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")
      .style("border", "2px solid black")
      .style("border-radius", "8px") 
      .style("padding", "10px") 
      .style("gap", "20px")
      .style("margin-top", "10px"); 

  approaches.forEach((approach, i) => {
      const legendItem = legend.append("div")
          .style("display", "flex")
          .style("align-items", "center")
          .style("gap", "15px");

      legendItem.append("div") // Colored circle
          .style("width", "12px")
          .style("height", "12px")
          .style("border-radius", "50%")
          .style("background-color", colors[i]);

      legendItem.append("span") // Label
          .style("font-size", "20px")
          .text(approach);
  });
}

// Call the function after the chart loads
createLegend();
