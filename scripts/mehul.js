// Viz 1 - Multi Bar Chart

// SVG dimensions and margin setup
const marginMehul = { top: 70, right: 120, bottom: 100, left: 140 }; // Increased top margin for title space
const widthMehul = 960 - marginMehul.left - marginMehul.right;
const heightMehul = 500 - marginMehul.top - marginMehul.bottom;

// Define scales
const x = d3.scaleBand().range([0, widthMehul]).padding(0.2);
const yICU = d3.scaleLinear().range([heightMehul, 0]);
const yMortality = d3.scaleLinear().range([heightMehul, 0]);

// Define axes with enhanced visibility
const xAxis = d3.axisBottom(x)
    .tickSize(-6);
const yAxisLeft = d3.axisLeft(yICU)
    .tickSize(-6);
const yAxisRight = d3.axisRight(yMortality)
    .ticks(5) // Dynamically updated tick marks based on data distribution
    .tickSize(-6)
    .tickFormat(d => d3.format(".0%")(d)); // Changed to show as whole percentages

// Append SVG container
const svgContainer = d3.select("#graph-container").append("svg")
    .attr("width", widthMehul + marginMehul.left + marginMehul.right)
    .attr("height", heightMehul + marginMehul.top + marginMehul.bottom);
    
// Add main title to the SVG
svgContainer.append("text")
    .attr("x", (widthMehul + marginMehul.left + marginMehul.right) / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Weight & Fate: The Surprising BMI-Survival Connection");
    
// Add subtitle with dramatic question
svgContainer.append("text")
    .attr("x", (widthMehul + marginMehul.left + marginMehul.right) / 2)
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-style", "italic")
    .text("Does your BMI truly determine your hospital outcome? Or is eating too much McDonalds going to continue for the average person?");
    
const svgMehul = svgContainer.append("g")
    .attr("transform", `translate(${marginMehul.left},${marginMehul.top})`);

// Tooltip setup
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("opacity", 0);

// Toggle state
let showSurvivors = true;

// Load data
d3.csv("data/hospital-data.csv").then(data => {
    // Preprocess data
    data.forEach(d => {
        d.bmi = +d.bmi;
        d.icu_days = +d.icu_days;
        d.death_inhosp = +d.death_inhosp;
    });

    const bmiBins = ["Underweight", "Normal", "Overweight", "Obese"];
    function getBmiGroup(bmi) {
        if (bmi < 18.5) return "Underweight";
        if (bmi >= 18.5 && bmi < 24.9) return "Normal";
        if (bmi >= 25 && bmi < 29.9) return "Overweight";
        return "Obese";
    }

    function updateChart() {
        // Filter data based on survivors vs deceased
        const filteredData = data.filter(d => showSurvivors ? d.death_inhosp === 0 : d.death_inhosp === 1);

        const groupedData = bmiBins.map(bmiGroup => {
            const allPatients = data.filter(d => getBmiGroup(d.bmi) === bmiGroup);
            const selectedPatients = filteredData.filter(d => getBmiGroup(d.bmi) === bmiGroup);
            const deceasedPatients = allPatients.filter(d => d.death_inhosp === 1);
            const survivingPatients = allPatients.filter(d => d.death_inhosp === 0);

            // Calculate mortality rate specifically for survivors or deceased
            let mortalityRate;
            if (showSurvivors) {
                // For survivors, show what % of each BMI group survived (1 - mortality rate)
                mortalityRate = allPatients.length > 0 
                    ? survivingPatients.length / allPatients.length
                    : 0;
            } else {
                // For deceased, show what % of each BMI group died (mortality rate)
                mortalityRate = allPatients.length > 0 
                    ? deceasedPatients.length / allPatients.length
                    : 0;
            }

            return {
                bmi_group: bmiGroup,
                icu_days: selectedPatients.length > 0 ? d3.mean(selectedPatients, d => d.icu_days) : 0,
                mortality_rate: mortalityRate,
                total_patients: allPatients.length,
                selected_patients: selectedPatients.length
            };
        });

        // Set domains for the scales
        x.domain(bmiBins);
        yICU.domain([0, d3.max(groupedData, d => d.icu_days) || 1]);
        
        // Determine the max value for mortality rate
        const maxMortalityRate = d3.max(groupedData, d => d.mortality_rate) || 0.02;
        // Round up to nearest 0.05 (5%) for a cleaner scale
        const roundedMaxMortality = Math.ceil(maxMortalityRate * 20) / 20;
        yMortality.domain([0, roundedMaxMortality]);

        // Remove old elements before redrawing the chart
        svgMehul.selectAll("*").remove();

        // Add horizontal grid lines for ICU days
        svgMehul.append("g")
            .attr("class", "grid-lines")
            .style("stroke", "#e0e0e0")
            .style("stroke-dasharray", "3,3")
            .style("stroke-opacity", 0.7)
            .selectAll("line")
            .data(yICU.ticks(5))
            .enter()
            .append("line")
            .attr("x1", 0)
            .attr("x2", widthMehul)
            .attr("y1", d => yICU(d))
            .attr("y2", d => yICU(d));

        // Add Axes with enhanced visibility
        svgMehul.append("g")
            .attr("transform", `translate(0, ${heightMehul})`)
            .call(xAxis)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .call(g => g.select(".domain").attr("stroke-width", 2)); // Make axis line thicker

        svgMehul.append("g")
            .call(yAxisLeft)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .call(g => g.select(".domain").attr("stroke-width", 2)); // Make axis line thicker

        svgMehul.append("g")
            .attr("transform", `translate(${widthMehul}, 0)`)
            .call(yAxisRight)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .call(g => g.select(".domain").attr("stroke-width", 2)); // Make axis line thicker

        // Add Axis Labels with increased size and visibility
        svgMehul.append("text")
            .attr("class", "x-axis-label")
            .attr("x", widthMehul / 2)
            .attr("y", heightMehul + marginMehul.bottom - 10)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .style("font-size", "16px") // Larger font
            .text("BMI Group");

        svgMehul.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -marginMehul.left + 30)  // Adjusted to prevent cutting off
            .attr("x", -heightMehul / 2)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .style("font-size", "16px") // Larger font
            .text("Average ICU Days");

        // Fix for the right y-axis label
        svgMehul.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(90)")
            .attr("x", heightMehul / 2)  // Vertical center of the y-axis
            .attr("y", -widthMehul - marginMehul.right + 30)  // Position to the right of the chart
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .style("font-size", "16px") // Larger font
            .text(showSurvivors ? "Survival Rate (%)" : "Mortality Rate (%)");

        // Add Bars (ICU Days - Blue)
        svgMehul.selectAll(".bar-icu")
            .data(groupedData)
            .join("rect")
            .attr("class", "bar-icu")
            .attr("x", d => x(d.bmi_group))
            .attr("width", x.bandwidth() / 2)
            .attr("y", d => yICU(d.icu_days))
            .attr("height", d => heightMehul - yICU(d.icu_days))
            .style("fill", "steelblue");

        // Add Bars (Mortality - Red)
        svgMehul.selectAll(".bar-mortality")
            .data(groupedData)
            .join("rect")
            .attr("class", "bar-mortality")
            .attr("x", d => x(d.bmi_group) + x.bandwidth() / 2)
            .attr("width", x.bandwidth() / 2)
            .attr("y", d => yMortality(d.mortality_rate))
            .attr("height", d => heightMehul - yMortality(d.mortality_rate))
            .style("fill", "red");

        // Tooltip Interactivity
        svgMehul.selectAll("rect")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                const rateLabel = showSurvivors ? "Survival Rate" : "Mortality Rate";
                tooltip.html(`
                    <strong>BMI:</strong> ${d.bmi_group}<br>
                    <strong>ICU Days:</strong> ${d.icu_days.toFixed(2)}<br>
                    <strong>${rateLabel}:</strong> ${(d.mortality_rate * 100).toFixed(1)}%<br>
                    <strong>Total Patients:</strong> ${d.total_patients}<br>
                    <strong>${showSurvivors ? "Survivors" : "Deceased"}:</strong> ${d.selected_patients}
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Update button text
        d3.select("#toggle-button").text(showSurvivors ? "Show Deceased Patients" : "Show Surviving Patients");

        // Add Legend
        const legend = svgMehul.append("g")
            .attr("transform", `translate(${widthMehul / 2 - 50}, ${heightMehul + 40})`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", "steelblue");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text("Average ICU Days")
            .style("font-size", "14px")
            .attr("alignment-baseline", "middle");

        legend.append("rect")
            .attr("x", 150)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", "red");

        legend.append("text")
            .attr("x", 170)
            .attr("y", 12)
            .text(showSurvivors ? "Survival Rate" : "Mortality Rate")
            .style("font-size", "14px")
            .attr("alignment-baseline", "middle");
    }    

    // Initial chart render
    updateChart();

    // Append the toggle button outside the SVG container (outside graph area)
    d3.select("#graph-container")
        .append("button")
        .attr("id", "toggle-button")
        .text("Show Deceased Patients")
        .style("margin-top", "10px")
        .style("padding", "10px")
        .style("font-size", "14px")
        .style("cursor", "pointer")
        .on("click", function() {
            showSurvivors = !showSurvivors;
            updateChart();  // Call updateChart when the button is clicked
        });
});

// Viz 2 - Risk Factors Heatmap
const marginHM = { top: 200, right: 100, bottom: 100, left: 160 }; // Adjusted margins
const widthHM = 1000 - marginHM.left - marginHM.right; // Increased width
const heightHM = 600 - marginHM.top - marginHM.bottom; // Increased height

// Create SVG container for heatmap - increase the overall height
const svgHeatmapContainer = d3.select("#heatmap-container").append("svg")
    .attr("width", widthHM + marginHM.left + marginHM.right)
    .attr("height", heightHM + marginHM.top + marginHM.bottom + 60) // Added extra height
    .attr("style", "margin: 0 auto; display: block;"); // Center the SVG in its container

// Add title to the heatmap SVG with proper positioning and spacing
svgHeatmapContainer.append("text")
    .attr("x", (widthHM + marginHM.left + marginHM.right) / 2)
    .attr("y", 45)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Heatmap Reveals All:");

// Add second line of title with more space
svgHeatmapContainer.append("text")
    .attr("x", (widthHM + marginHM.left + marginHM.right) / 2)
    .attr("y", 85)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Cracking the Code Between Patient Characteristics and Clinical Outcomes");

// Add subtitle with much more spacing
svgHeatmapContainer.append("text")
    .attr("x", (widthHM + marginHM.left + marginHM.right) / 2)
    .attr("y", 130) // Significantly increased spacing
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-style", "italic")
    .text("Are the patients truly at fault for their plight? Or are these factors uncontrollable?");

const svgHeatmap = svgHeatmapContainer.append("g")
    .attr("transform", `translate(${marginHM.left},${marginHM.top})`);


// Tooltip for heatmap
const heatmapTooltip = d3.select("body").append("div")
    .attr("class", "heatmap-tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("opacity", 0);

// Load data for heatmap
d3.csv("data/hospital-data.csv").then(data => {
    // Preprocess data
    data.forEach(d => {
        d.bmi = +d.bmi;
        d.age = +d.age;
        d.asa = +d.asa;
        d.preop_htn = +d.preop_htn;
        d.preop_dm = +d.preop_dm;
        d.icu_days = +d.icu_days;
        d.death_inhosp = +d.death_inhosp;
    });

    // Function to calculate correlation coefficient
    function correlationCoefficient(x, y) {
        const n = x.length;
        let sum_x = 0;
        let sum_y = 0;
        let sum_xy = 0;
        let sum_x2 = 0;
        let sum_y2 = 0;
        
        for (let i = 0; i < n; i++) {
            sum_x += x[i];
            sum_y += y[i];
            sum_xy += x[i] * y[i];
            sum_x2 += x[i] * x[i];
            sum_y2 += y[i] * y[i];
        }
        
        // Calculate correlation coefficient
        const numerator = n * sum_xy - sum_x * sum_y;
        const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
        
        if (denominator === 0) return 0; // Avoid division by zero
        return numerator / denominator;
    }

    // Define the risk factors and outcomes
    const riskFactors = ["age", "bmi", "preop_htn", "preop_dm", "asa"];
    const outcomes = ["icu_days", "death_inhosp"];
    
    // Calculate correlation between risk factors and outcomes
    let correlationData = [];
    
    // For each risk factor, calculate correlation with outcomes
    riskFactors.forEach(factor => {
        outcomes.forEach(outcome => {
            const factorValues = data.map(d => d[factor]);
            const outcomeValues = data.map(d => d[outcome]);
            
            const correlation = correlationCoefficient(factorValues, outcomeValues);
            
            correlationData.push({
                factor: factor,
                outcome: outcome,
                correlation: correlation
            });
        });
    });
    
    // Calculate min and max correlation values to determine the domain
    const minCorrelation = d3.min(correlationData, d => d.correlation);
    const maxCorrelation = d3.max(correlationData, d => d.correlation);
    
    // Add a bit of padding to make the scale slightly wider than the data
    const paddedMin = Math.floor(minCorrelation * 10) / 10 - 0.05;
    const paddedMax = Math.ceil(maxCorrelation * 10) / 10 + 0.05;
    
    // Create color scale for correlation strength with adjusted domain
    const colorScale = d3.scaleSequential()
        .domain([paddedMin, paddedMax])
        .interpolator(d3.interpolatePRGn); // Purple-Green scale with more saturation
    
    // Set up x and y scales
    const xHM = d3.scaleBand()
        .domain(riskFactors)
        .range([0, widthHM])
        .padding(0.1); // Increased padding for better visibility
    
    const yHM = d3.scaleBand()
        .domain(outcomes)
        .range([0, heightHM])
        .padding(0.1); // Increased padding for better visibility
    
    // Add factor labels (x-axis) with larger text
    svgHeatmap.selectAll(".factor-label")
        .data(riskFactors)
        .enter()
        .append("text")
        .attr("class", "factor-label")
        .attr("x", d => xHM(d) + xHM.bandwidth() / 2)
        .attr("y", -15) // More distance from chart
        .attr("text-anchor", "middle")
        .style("font-size", "16px") // Further increased from 14px
        .style("font-weight", "bold")
        .text(d => {
            // Format the labels to be more readable
            const labels = {
                "age": "Age",
                "bmi": "BMI",
                "preop_htn": "Hypertension",
                "preop_dm": "Diabetes",
                "asa": "ASA Score"
            };
            return labels[d];
        });
    
    // Add outcome labels (y-axis) with larger text
    svgHeatmap.selectAll(".outcome-label")
        .data(outcomes)
        .enter()
        .append("text")
        .attr("class", "outcome-label")
        .attr("x", -20) // More distance from chart
        .attr("y", d => yHM(d) + yHM.bandwidth() / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .style("font-size", "16px") // Further increased from 14px
        .style("font-weight", "bold")
        .text(d => {
            const labels = {
                "icu_days": "ICU Stay Duration",
                "death_inhosp": "In-Hospital Mortality"
            };
            return labels[d];
        });
    
    // Create heatmap cells
    svgHeatmap.selectAll(".heatmap-cell")
        .data(correlationData)
        .enter()
        .append("rect")
        .attr("class", "heatmap-cell")
        .attr("x", d => xHM(d.factor))
        .attr("y", d => yHM(d.outcome))
        .attr("width", xHM.bandwidth())
        .attr("height", yHM.bandwidth())
        .style("fill", d => colorScale(d.correlation))
        .style("stroke", "white")
        .style("stroke-width", 2); // Increased from 1
    
    // Add correlation values to cells
    svgHeatmap.selectAll(".correlation-text")
        .data(correlationData)
        .enter()
        .append("text")
        .attr("class", "correlation-text")
        .attr("x", d => xHM(d.factor) + xHM.bandwidth() / 2)
        .attr("y", d => yHM(d.outcome) + yHM.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "14px") // Increased from 12px
        .style("fill", d => Math.abs(d.correlation) > 0.4 ? "white" : "black")
        .text(d => d.correlation.toFixed(2));
    
    // Add interactivity
    svgHeatmap.selectAll(".heatmap-cell")
        .on("mouseover", function(event, d) {
            // Highlight the cell
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 2);
            
            // Show tooltip
            heatmapTooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            // Format tooltip content
            const factorLabels = {
                "age": "Age",
                "bmi": "BMI",
                "preop_htn": "Hypertension",
                "preop_dm": "Diabetes",
                "asa": "ASA Score"
            };
            
            const outcomeLabels = {
                "icu_days": "ICU Stay Duration",
                "death_inhosp": "In-Hospital Mortality"
            };
            
            // Determine correlation strength description (relative to hospital data)
            let strengthDesc;
            const absCorr = Math.abs(d.correlation);
            if (absCorr < 0.03) strengthDesc = "Very weak";
            else if (absCorr < 0.08) strengthDesc = "Weak";
            else if (absCorr < 0.15) strengthDesc = "Moderate";
            else if (absCorr < 0.20) strengthDesc = "Strong";
            else strengthDesc = "Very strong";
            
            // Direction of correlation
            const direction = d.correlation > 0 ? "positive" : "negative";
            
            heatmapTooltip.html(`
                <strong>${factorLabels[d.factor]} → ${outcomeLabels[d.outcome]}</strong><br>
                <strong>Correlation:</strong> ${d.correlation.toFixed(2)}<br>
                <strong>Strength:</strong> ${strengthDesc} ${direction} correlation<br>
                <span style="font-style: italic; font-size: 12px;">Click for further analysis</span>
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function() {
            // Restore original cell styles
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 2);
            
            // Hide tooltip
            heatmapTooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(event, d) {
            // Create a more meaningful interaction
            const selectedFactor = d.factor;
            const selectedOutcome = d.outcome;
            
            // Update UI to show what's selected
            d3.selectAll(".heatmap-cell").style("opacity", 0.5);
            d3.select(this).style("opacity", 1).style("stroke", "#000").style("stroke-width", 3);
            
            // Get the data for this factor
            const factorThresholds = {
                "age": 65, // Elderly threshold
                "bmi": 30, // Obesity threshold
                "preop_htn": 0.5, // Binary - has hypertension
                "preop_dm": 0.5, // Binary - has diabetes
                "asa": 3 // Higher risk ASA score
            };
            
            const factorLabels = {
                "age": "Age",
                "bmi": "BMI",
                "preop_htn": "Hypertension",
                "preop_dm": "Diabetes",
                "asa": "ASA Score"
            };
            
            const threshold = factorThresholds[selectedFactor];
            
            // Create a filtered dataset for the bmi chart
            const filteredData = data.filter(patient => {
                if (selectedFactor === "preop_htn" || selectedFactor === "preop_dm") {
                    return patient[selectedFactor] === 1; // Binary conditions
                } else if (selectedFactor === "age") {
                    return patient[selectedFactor] >= threshold; // Older patients
                } else if (selectedFactor === "bmi") {
                    return patient[selectedFactor] >= threshold; // Obese patients
                } else if (selectedFactor === "asa") {
                    return patient[selectedFactor] >= threshold; // Higher risk
                }
                return true;
            });
            
            // Show a more useful notification
            const patientCount = filteredData.length;
            const totalPatients = data.length;
            const percentage = ((patientCount / totalPatients) * 100).toFixed(1);
            
            // Create a floating info panel if it doesn't exist
            let infoPanel = d3.select("#info-panel");
            if (infoPanel.empty()) {
                infoPanel = d3.select("body").append("div")
                    .attr("id", "info-panel")
                    .style("position", "fixed")
                    .style("top", "20px")
                    .style("right", "20px")
                    .style("background", "rgba(245, 245, 245, 0.9)")
                    .style("border", "1px solid #333")
                    .style("border-radius", "5px")
                    .style("padding", "15px")
                    .style("max-width", "300px")
                    .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)")
                    .style("z-index", "1000");
            }
            
            infoPanel.html(`
                <h3>Selected Risk Factor: ${factorLabels[selectedFactor]}</h3>
                <p><strong>Correlation with ${selectedOutcome === "icu_days" ? "ICU Stay" : "Mortality"}:</strong> ${d.correlation.toFixed(2)}</p>
                <p><strong>Patient Group:</strong> ${patientCount} patients (${percentage}% of total)</p>
                <p>This would filter the BMI chart to show only patients with ${selectedFactor === "preop_htn" ? "hypertension" : 
                   selectedFactor === "preop_dm" ? "diabetes" : 
                   selectedFactor === "age" ? "age ≥ " + threshold : 
                   selectedFactor === "bmi" ? "BMI ≥ " + threshold : 
                   "ASA score ≥ " + threshold}</p>
                <button id="close-info">Close</button>
            `);
            
            // Add close button functionality
            d3.select("#close-info").on("click", function() {
                d3.select("#info-panel").remove();
                d3.selectAll(".heatmap-cell").style("opacity", 1).style("stroke", "white").style("stroke-width", 2);
            });
        });
    
    // Add legend
    const legendWidth = 350; // Increased legend width
    const legendHeight = 25; // Increased legend height
    
    // Update legend to use the actual data range
    const legendX = d3.scaleLinear()
        .domain([paddedMin, paddedMax])
        .range([0, legendWidth]);
    
    // Create ticks based on our actual data range
    const tickStep = (paddedMax - paddedMin) / 8; // Create ~8 ticks across range
    const tickValues = d3.range(paddedMin, paddedMax + tickStep/2, tickStep);
    
    const legendXAxis = d3.axisBottom(legendX)
        .tickFormat(d3.format(".2f"))
        .tickValues(tickValues);
    
    const legend = svgHeatmap.append("g")
        .attr("transform", `translate(${(widthHM - legendWidth) / 2}, ${heightHM + 50})`);
    
    // Create a gradient for the legend
    const defs = svgHeatmap.append("defs");
    
    const gradient = defs.append("linearGradient")
        .attr("id", "correlation-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
    
    // Add color stops for the gradient - based on the actual data range
    const stops = [
        { offset: "0%", color: colorScale(paddedMin) },
        { offset: "50%", color: colorScale((paddedMin + paddedMax) / 2) },
        { offset: "100%", color: colorScale(paddedMax) }
    ];
    
    gradient.selectAll("stop")
        .data(stops)
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    
    // Draw the legend rectangle
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#correlation-gradient)");
    
    // Add the legend axis with bolder styling
    legend.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendXAxis)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .call(g => g.select(".domain").attr("stroke-width", 2)); // Make axis line thicker
    
    // Add legend title with more vertical spacing
    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Correlation Strength");
    
    // Update the legend endpoints with actual min/max values
    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Negative");
    
    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Positive");
});