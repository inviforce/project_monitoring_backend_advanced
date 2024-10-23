const getData = async () => {
    try {
        const resp = await fetch("http://localhost:3000/datee");
        const data = await resp.json();
        console.log(data);
        return data; // Return the fetched data
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

getData()
    .then(data => { 
        if (!data) {
            console.error("No data received");
            return;
        }
        
        const voltageArray = data.voltage;
        const currentArray = data.current;
        const energyArray = data.energy;
        const powerFactorArray = data.powerFactor; // Make sure this key exists in your data
        const timeArray = data.time.map(time => new Date(time));  // Convert to Date objects

        // Create traces for voltage, current, and energy
        const voltageTrace = {
            x: timeArray,
            y: voltageArray,
            type: 'scatter',
            mode: 'lines',
            name: 'Voltage'
        };

        const currentTrace = {
            x: timeArray,
            y: currentArray,
            type: 'scatter',
            mode: 'lines',
            name: 'Current'
        };

        const energyTrace = {
            x: timeArray,
            y: energyArray,
            type: 'scatter',
            mode: 'lines',
            name: 'Energy'
        };

        // Combine all traces into the data array
        const plotData = [voltageTrace, currentTrace, energyTrace];

        // Layout for the graph
        const layout = {
            title: 'Voltage, Current, and Energy Over Time',
            xaxis: { title: 'Time' },
            yaxis: { title: 'Values' }
        };

        // Plot the graph using Plotly
        Plotly.newPlot('plot', plotData, layout);
    })
    .catch(error => {
        console.error('Error:', error);
    });
