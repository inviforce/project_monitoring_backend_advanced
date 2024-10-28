document.addEventListener('DOMContentLoaded', function() {
    // Get data from localStorage that was stored by timeRange.js
    const graphData = JSON.parse(localStorage.getItem('graphData'));
    
    if (!graphData) {
        console.error("No data available");
        return;
    }

    // Convert time strings to Date objects
    const timeArray = graphData.time.map(time => new Date(time));

    // Create traces for each metric
    const traces = [
        {
            x: timeArray,
            y: graphData.voltage,
            type: 'scatter',
            mode: 'lines',
            name: 'Voltage'
        },
        {
            x: timeArray,
            y: graphData.current,
            type: 'scatter',
            mode: 'lines',
            name: 'Current'
        },
        {
            x: timeArray,
            y: graphData.energy,
            type: 'scatter',
            mode: 'lines',
            name: 'Energy'
        },
        {
            x: timeArray,
            y: graphData.powerFactor,
            type: 'scatter',
            mode: 'lines',
            name: 'Power Factor'
        }
    ];

    // Layout configuration
    const layout = {
        title: 'Power Metrics Over Time',
        xaxis: {
            title: 'Time',
            rangeslider: {}
        },
        yaxis: {
            title: 'Values'
        },
        height: 600,
        showlegend: true
    };

    // Plot the graph
    Plotly.newPlot('plot', traces, layout);
});