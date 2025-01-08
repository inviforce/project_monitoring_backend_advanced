const socket = new WebSocket('ws://localhost:3027');

socket.onopen = function() {
    console.log("WebSocket connection established");
};

socket.onmessage = function(event) {
    try {
        const mess = JSON.parse(event.data);
        console.log(mess);
        updateGauges(mess.voltage, mess.current, mess.power, mess.energy, mess.frequency, mess.powerFactor, mess.temperature,mess.humidity);
    } catch (error) {
        console.error("Error parsing message:", error);
        console.log("Problematic message:", event.data);
    }
};

// Function to create a gauge
function createGauge(id, initialValue, titleText,initialrange,finalrange) {
    const data = [{
        type: "indicator",
        mode: "gauge+number",
        value: initialValue,
        title: { text: titleText, font: { size: 20 } },
        number: { valueformat: ".2f" },
        gauge: {
            axis: { range: [initialrange, finalrange], tickwidth: 1, tickcolor: "darkblue" },
            bar: { color: "darkblue", thickness: 0.05, length: 0.8 },
            steps: [
                { range: [0, (finalrange+initialrange)/2], color: "rgba(255, 99, 132, 0.6)" },
                { range: [(finalrange+initialrange)/2, finalrange], color: "rgba(54, 162, 235, 0.6)" }
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
let humditydata=[];
function lineGraph(id, initialValue, titleText,values) {
    var trace = {
        x: timeData,
        y: values,
        mode: 'lines',
        line: { color: '#80CAF6' }
    };

    var data = [trace];

    var layout = {
        title: titleText,
        xaxis: { title: 'Time (ms)' },
        yaxis: { 
            title: titleText,
            tickformat: '.2f'  // Display y-axis values with 2 decimal places
        },
        margin: { t: 50 }
    };

    Plotly.newPlot(id, data, layout);
}

// function lineGraph(id, initialValue, titleText, values) {
//     var trace = {
//         x: timeData,
//         y: values,
//         mode: 'lines',
//         line: { color: '#80CAF6' }
//     };

//     var data = [trace];

//     var layout = {
//         title: titleText,
//         xaxis: { 
//             title: 'Time (ms)', 
//             range: [Math.max(0, timeData[timeData.length - 1] - 10), timeData[timeData.length - 1]] // Window size of 1000
//         },
//         yaxis: { 
//             title: titleText,
//             tickformat: '.2f'  // Display y-axis values with 2 decimal places
//         },
//         margin: { t: 50 }
//     };

//     Plotly.newPlot(id, data, layout);
// }

// function lineGraph(id, timeData, values, titleText) {
//     // Trim the data to the latest 1000 entries if it exceeds 1000
//     if (timeData.length > 10) {
//         timeData = timeData.slice(-10); // Keep the last 1000 timestamps
//         values = values.slice(-10);    // Keep the last 1000 values
//     }

//     var trace = {
//         x: timeData,
//         y: values,
//         mode: 'lines',
//         line: { color: '#80CAF6' }
//     };

//     var data = [trace];

//     var layout = {
//         title: titleText,
//         xaxis: { title: 'Time (ms)' },
//         yaxis: { 
//             title: titleText,
//             tickformat: '.2f'  // Display y-axis values with 2 decimal places
//         },
//         margin: { t: 50 }
//     };

//     Plotly.newPlot(id, data, layout);
// }


// Create the gauges with initial values
createGauge('gauge1', 0, 'Voltage',0.00,500.00);
createGauge('gauge2', 0, 'Current',0.0,100.0);
createGauge('gauge3', 0, 'Power',0.0,500.0);
createGauge('gauge4', 0, 'Energy',0.0,500.0);
createGauge('gauge5', 0, 'Frequency',0.0,200.0);
createGauge('gauge6', 0, 'Power Factor',0.0,1.0);
lineGraph('line1', 0, 'Temperature Over Time',temperatureData);
lineGraph('line2', 0, 'Humidity Over Time',humditydata);


// Function to update the gauges with new data
function updateGauges(voltage, current, power, energy, frequency, power_f, temperature,humidity) {
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
    humditydata.push(humidity);

    // Update the line graph with new data
    Plotly.update('line1', { y: [temperatureData], x: [timeData] }, [0]);
    Plotly.update('line2', { y: [humditydata], x: [timeData] }, [0]);
}




 