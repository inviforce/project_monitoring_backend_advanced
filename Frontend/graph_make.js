const socket = new WebSocket('ws://localhost:3027');

socket.onopen = function () {
    console.log("WebSocket connection established");
};

socket.onmessage = function (event) {
    try {
        const mess = JSON.parse(event.data);
        console.log(mess);
        updateGauges(mess.voltage, mess.current, mess.power, mess.energy, mess.frequency, mess.powerFactor, mess.temperature, mess.humidity);
    } catch (error) {
        console.error("Error parsing message:", error);
        console.log("Problematic message:", event.data);
    }
};

// Function to create a gauge with dark theme
function createGauge(id, initialValue, titleText, initialrange, finalrange) {
    const data = [{
        type: "indicator",
        mode: "gauge+number",
        value: initialValue,
        title: { 
            text: titleText, 
            font: { 
                size: 24, 
                color: '#94a3b8',
                family: 'Inter, system-ui, sans-serif'
            } 
        },
        number: { 
            valueformat: ".2f",
            font: { 
                color: '#e2e8f0',
                size: 28,
                family: 'Inter, system-ui, sans-serif'
            }
        },
        gauge: {
            axis: { 
                range: [initialrange, finalrange], 
                tickwidth: 2, 
                tickcolor: "#475569",
                tickfont: { 
                    color: '#94a3b8',
                    size: 12
                }
            },
            bar: { 
                color: "#3b82f6", 
                thickness: 0.25,
                length: 0.8
            },
            bgcolor: "transparent",
            borderwidth: 2,
            bordercolor: "#1e293b",
            steps: [
                { range: [0, finalrange * 0.3], color: "#0f172a" },
                { range: [finalrange * 0.3, finalrange * 0.7], color: "#1e293b" },
                { range: [finalrange * 0.7, finalrange], color: "#334155" }
            ]
        }
    }];

    const layout = {
        width: 300,
        height: 250,
        margin: { t: 40, r: 25, l: 25, b: 25 },
        paper_bgcolor: 'transparent',
        font: { 
            color: '#94a3b8',
            family: 'Inter, system-ui, sans-serif'
        },
        plot_bgcolor: 'transparent'
    };

    const config = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot(id, data, layout, config);
}

let timeData = []; // Array to hold time or index values
let temperatureData = []; // Array to hold temperature values
let humditydata = [];
function lineGraph(id, titleText, values) {
    const trace = {
        x: timeData,
        y: values,
        mode: 'lines',
        line: { 
            color: '#3b82f6',
            width: 3,
            shape: 'spline',
            smoothing: 1.3
        },
        fill: 'tonexty',
        fillcolor: 'rgba(59, 130, 246, 0.1)'
    };

    const data = [trace];

    const layout = {
        title: {
            text: titleText,
            font: {
                size: 24,
                color: '#94a3b8',
                family: 'Inter, system-ui, sans-serif'
            }
        },
        xaxis: { 
            title: 'Time (ms)',
            gridcolor: '#1e293b',
            gridwidth: 1,
            zerolinecolor: '#475569',
            zerolinewidth: 2,
            showline: true,
            linecolor: '#475569',
            linewidth: 2,
            tickfont: {
                color: '#94a3b8',
                size: 12
            }
        },
        yaxis: { 
            title: titleText,
            gridcolor: '#1e293b',
            gridwidth: 1,
            zerolinecolor: '#475569',
            zerolinewidth: 2,
            showline: true,
            linecolor: '#475569',
            linewidth: 2,
            tickformat: '.2f',
            tickfont: {
                color: '#94a3b8',
                size: 12
            }
        },
        margin: { t: 50, r: 20, l: 60, b: 50 },
        plot_bgcolor: '#0f172a',
        paper_bgcolor: 'transparent',
        showlegend: false,
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: '#1e293b',
            font: { color: '#e2e8f0' }
        }
    };

    const config = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot(id, data, layout, config);
}
// Create the gauges with initial values
createGauge('gauge1', 0, 'Voltage', 0.00, 500.00);
createGauge('gauge2', 0, 'Current', 0.0, 100.0);
createGauge('gauge3', 0, 'Power', 0.0, 500.0);
createGauge('gauge4', 0, 'Energy', 0.0000, 0.01000);
createGauge('gauge5', 0, 'Frequency', 0.0, 200.0);
createGauge('gauge6', 0, 'Power Factor', 0.0, 1.0);
lineGraph('line1', 0, 'Temperature Over Time', temperatureData);
lineGraph('line2', 0, 'Humidity Over Time', humditydata);


// Function to update the gauges with new data
function updateGauges(voltage, current, power, energy, frequency, powerFactor, temperature, humidity) {
    Plotly.update('gauge1', { value: [voltage] }, [0]);
    Plotly.update('gauge2', { value: [current] }, [0]);
    Plotly.update('gauge3', { value: [power] }, [0]);
    Plotly.update('gauge4', { value: [energy] }, [0]);
    Plotly.update('gauge5', { value: [frequency] }, [0]);
    Plotly.update('gauge6', { value: [powerFactor] }, [0]);

    // Update the temperature data
    const currentTime = timeData.length; // You can modify this to use real timestamps
    timeData.push(currentTime); // Append the current time/index
    temperatureData.push(temperature); // Append the temperature
    humditydata.push(humidity);

    // Update the line graph with new data
    Plotly.update('line1', { y: [temperatureData], x: [timeData] }, [0]);
    Plotly.update('line2', { y: [humditydata], x: [timeData] }, [0]);
}




