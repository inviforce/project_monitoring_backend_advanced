const socket = new WebSocket('ws://localhost:3027');

socket.onopen = function() {
    console.log("WebSocket connection established");
};

socket.onmessage = function(event) {
    try {
        const mess = JSON.parse(event.data);
        console.log(mess);
        updateGauges(mess.voltage, mess.current, mess.power, mess.energy, mess.frequency, mess.power_f, mess.temperature);
    } catch (error) {
        console.error("Error parsing message:", error);
        console.log("Problematic message:", event.data);
    }
};

// Function to create a gauge
function createGauge(id, initialValue, titleText) {
    const data = [{
        type: "indicator",
        mode: "gauge+number",
        value: initialValue,
        title: { text: titleText, font: { size: 20 } },
        gauge: {
            axis: { range: [0, 1000], tickwidth: 1, tickcolor: "darkblue" },
            bar: { color: "darkblue", thickness: 0.05, length: 0.8 },
            steps: [
                { range: [0, 500], color: "rgba(255, 99, 132, 0.6)" },
                { range: [500, 1000], color: "rgba(54, 162, 235, 0.6)" }
            ]
        }
    }];

    const layout = { 
        width: 300, 
        height: 300, 
        margin: { t: 40, r: 40, l: 40, b: 40 },
        paper_bgcolor: "#f3f4f5",
        font: { color: "#2c3e50", family: "Arial" }
    };
    
    Plotly.newPlot(id, data, layout);
}

let timeData = []; // Array to hold time or index values
let temperatureData = []; // Array to hold temperature values

function lineGraph(id, initialValue, titleText) {
    var trace = {
        x: timeData,
        y: temperatureData,
        mode: 'lines',
        line: { color: '#80CAF6' }
    };

    var data = [trace];

    var layout = {
        title: titleText,
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Temperature Value' },
        margin: { t: 50 }
    };

    Plotly.newPlot(id, data, layout);
}

// Create the gauges with initial values
createGauge('gauge1', 0, 'Voltage');
createGauge('gauge2', 0, 'Current');
createGauge('gauge3', 0, 'Power');
createGauge('gauge4', 0, 'Energy');
createGauge('gauge5', 0, 'Frequency');
createGauge('gauge6', 0, 'Power Factor');
lineGraph('line1', 0, 'Temperature Over Time');

// Function to update the gauges with new data
function updateGauges(voltage, current, power, energy, frequency, power_f, temperature) {
    Plotly.update('gauge1', { value: [voltage] }, [0]);
    Plotly.update('gauge2', { value: [current] }, [0]);
    Plotly.update('gauge3', { value: [power] }, [0]);
    Plotly.update('gauge4', { value: [energy] }, [0]);
    Plotly.update('gauge5', { value: [frequency] }, [0]);
    Plotly.update('gauge6', { value: [power_f] }, [0]);

    // Update the temperature data
    const currentTime = timeData.length; // You can modify this to use real timestamps
    timeData.push(currentTime); // Append the current time/index
    temperatureData.push(temperature); // Append the temperature

    // Update the line graph with new data
    Plotly.update('line1', { y: [temperatureData], x: [timeData] }, [0]);
}



 