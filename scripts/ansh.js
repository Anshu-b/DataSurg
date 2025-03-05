// Set up the SVG canvas with further increased left margin for y-axis label
const margin = { top: 40, right: 30, bottom: 80, left: 80 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set up the dropdown filter
const sexDropdown = d3.select("#sex-filter");

// Add a resample button to the page
d3.select("#scatterplot")
  .insert("button", ":first-child")
  .attr("id", "resample-button")
  .attr("class", "btn")
  .style("margin-bottom", "10px")
  .text("Resample Data (75 points)")
  .on("click", resampleData);

// Store our full dataset
let fullData = [];
let sampledData = [];
const sampleSize = 75;

// Helper function to convert minutes to days
function minutesToDays(minutes) {
  return minutes / (24 * 60); // 24 hours * 60 minutes
}

// Define the updateScatterPlot function
function updateScatterPlot(data) {
  const selectedSex = sexDropdown.property("value");

  const filteredData = data.filter(d => d.sex === selectedSex || selectedSex === "All");

  // Set up the scales for the axes
  const xScale = d3.scaleLinear()
    .domain([d3.min(filteredData, d => d.age) - 5, d3.max(filteredData, d => d.age) + 5])
    .range([0, width]);

  // Convert surgery duration from minutes to days for the y-scale
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => minutesToDays(d.opend - d.opstart))])
    .range([height, 0]);

  // Set up the color scale for surgery approach
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Clear previous plot
  svg.selectAll("*").remove();

  // Add plot title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Relationship Between Patient Age, Surgery Duration, and Approach");

  // Add the X and Y axes
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .call(d3.axisLeft(yScale)
      .tickFormat(d => d.toFixed(3))); // Format to 3 decimal places for days

  // Add axis labels
  svg.append("text")
    .attr("transform", "translate(" + (width / 2) + "," + (height + 30) + ")")
    .style("text-anchor", "middle")
    .text("Age")
    .attr("y", -margin.top + 50)
    .style("font-size", "16px");

  // Further improved y-axis label positioning
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10) // Move it more to the right (closer to the axis)
    .attr("x", -(height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "16px") // Ensure font size is reasonable
    .text("Surgery Duration (days)");

  // Create the scatterplot points
  const circles = svg.selectAll("circle")
    .data(filteredData, d => d.age);

  circles.enter().append("circle")
    .merge(circles)
    .attr("cx", d => xScale(d.age))
    .attr("cy", d => yScale(minutesToDays(d.opend - d.opstart)))
    .attr("r", d => Math.sqrt(d.bmi) * 2) // Size by BMI
    .style("fill", d => colorScale(d.approach))
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

    // Get the approaches for the legend
    const approaches = Array.from(new Set(filteredData.map(d => d.approach)));
    
    // Calculate a wider legend width based on the longest approach name
    const maxApproachLength = Math.max(...approaches.map(a => a.length));
    const legendWidth = Math.max(160, maxApproachLength * 10); // At least 160px, or wider for long names
    const legendHeight = approaches.length * 25 + 40; // More height per item + padding for title
    
    // Add legend background and border - positioned further right
    svg.append("rect")
      .attr("x", width - legendWidth - 10)
      .attr("y", 10)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 5) // Rounded corners
      .attr("ry", 5)
      .style("fill", "#f8f9fa") // Light background
      .style("stroke", "#dee2e6") // Border color
      .style("stroke-width", 1.5)
      .style("opacity", 0.9);
    
    // Add legend title
    svg.append("text")
      .attr("x", width - legendWidth / 2 - 10)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text("Surgery Approach");
    
    // Add legend items with increased vertical spacing
    const legend = svg.append("g")
      .attr("transform", "translate(" + (width - legendWidth + 15) + ", 40)");

    const legendItems = legend.selectAll(".legend")
      .data(approaches)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => "translate(0," + i * 25 + ")"); // Increased spacing between items

    legendItems.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .attr("rx", 2) // Slightly rounded corners for color boxes
      .attr("ry", 2)
      .style("fill", colorScale);

    legendItems.append("text")
      .attr("x", 24)
      .attr("y", 8)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .text(d => d);
}

// Function to resample data
function resampleData() {
  // Visual feedback - change button text temporarily
  const button = d3.select("#resample-button");
  
  // Add a small delay to show the button text change
  setTimeout(() => {
    // Resample the data
    sampledData = d3.shuffle(fullData).slice(0, sampleSize);
    
    // Update the plot with new sample
    updateScatterPlot(sampledData);
    
    // Reset button text
    button.text("Resample Data (75 points)");
  }, 300);
}

// Load data from CSV
d3.csv("data/hospital-data.csv").then(function(data) {
  // Convert necessary columns to appropriate data types
  data.forEach(d => {
    d.age = +d.age;
    d.opstart = +d.opstart;
    d.opend = +d.opend;
    d.bmi = +d.bmi;
    d.approach = d.approach;
    d.sex = d.sex;
  });

  // Store the full dataset
  fullData = data;
  
  // Get initial sample
  sampledData = d3.shuffle(fullData).slice(0, sampleSize);

  // Initial setup for scatterplot
  updateScatterPlot(sampledData);

  // Update scatterplot when the dropdown filter changes
  sexDropdown.on("change", function() {
    updateScatterPlot(sampledData);
  });
});