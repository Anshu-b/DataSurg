// Set up dimensions
const margin = { top: 50, right: 30, bottom: 100, left: 80 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the data
d3.csv("surgical_data.csv").then(data => {
    // Convert count values to numbers
    data.forEach(d => d.count = +d.count);

    // Get unique department names
    const departments = [...new Set(data.map(d => d.department))];

    // Create dropdown menu
    d3.select("#dropdown")
        .selectAll("option")
        .data(departments)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Initial chart load
    updateChart(departments[0]); // Load first department

    // Listen for dropdown change
    d3.select("#dropdown").on("change", function () {
        updateChart(this.value);
    });

    function updateChart(selectedDepartment) {
        // Filter data by selected department
        const filteredData = data.filter(d => d.department === selectedDepartment);

        // Scale for x-axis (surgery types)
        const x = d3.scaleBand()
            .domain(filteredData.map(d => d.optype))
            .range([0, width])
            .padding(0.3);

        // Scale for y-axis (counts)
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.count)])
            .range([height, 0]);

        // Remove previous axes
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();

        // Add x-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Bind data to bars
        const bars = svg.selectAll(".bar")
            .data(filteredData, d => d.optype);

        // Remove old bars
        bars.exit().transition().duration(500).attr("y", height).attr("height", 0).remove();

        // Update existing bars
        bars.transition().duration(500)
            .attr("x", d => x(d.optype))
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count));

        // Enter new bars
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.optype))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .attr("fill", "#69b3a2")
            .merge(bars)
            .transition().duration(500)
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count));
    }
});