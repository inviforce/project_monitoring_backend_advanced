// const parser=function(input){
//     const data = input.replace('*', '').split('-');

//     // Check if the number of elements is as expected (e.g., 9 parts)
//     if (data.length !== 9) {
//         throw new Error(`Unexpected data format: ${input}`);
//     }
    
//     // Create an object with the extracted values
//     let nodeData
//     // if(data[0]="SEG0001"){
//         nodeData = {
//             nodeId: data[0],
//             voltage: parseFloat(data[3]),
//             current: parseFloat(data[4]),
//             power: parseFloat(data[5]),
//             energy: parseFloat(data[6]),
//             frequency: parseFloat(data[7]),
//             temperature: parseFloat(data[1]),
//             power_f: parseFloat(data[8]),
//             humidity: parseFloat(data[2]),
//         };
//     // }

//     return nodeData;
// }
// // console.log((parser("SEG0001-28.29-41.17-230.00-0.00-0.00-0.53-49.90-0.00*")))

// module.exports=parser
  
const maker = (message) => {
    try {
        console.log("Raw message:", message);
        let parsedData = JSON.parse(message);  // Parse the JSON string

        console.log("Parsed Data:", parsedData);

        // List all required keys and add missing ones with a default of 0
        const requiredKeys = [
            "v1", "v2", "v3",
            "c1", "c2", "c3",
            "p1", "p2", "p3",
            "energy", "frequency", "powerFactor", "temperature", "humidity", "alarms"
        ];
        requiredKeys.forEach(key => {
            if (!(key in parsedData)) {
                parsedData[key] = 0;
            }
        });

        // Build an array of device objects, ensuring that if a value is 0 it remains 0
        const devices = [
            {
                device: 1,
                voltage: parsedData.v1 ?? 0,
                current: parsedData.c1 ?? 0,
                power: parsedData.p1 ?? 0,
                energy: parsedData.energy ?? 0,
                frequency: parsedData.frequency ?? 0,
                powerFactor: parsedData.powerFactor ?? 0,
                temperature: parsedData.temperature ?? 0,
                humidity: parsedData.humidity ?? 0,
                alarms: parsedData.alarms ?? 0
            },
            {
                device: 2,
                voltage: parsedData.v2 ?? 0,
                current: parsedData.c2 ?? 0,
                power: parsedData.p2 ?? 0,
                energy: parsedData.energy ?? 0,
                frequency: parsedData.frequency ?? 0,
                powerFactor: parsedData.powerFactor ?? 0,
                temperature: parsedData.temperature ?? 0,
                humidity: parsedData.humidity ?? 0,
                alarms: parsedData.alarms ?? 0
            },
            {
                device: 3,
                voltage: parsedData.v3 ?? 0,
                current: parsedData.c3 ?? 0,
                power: parsedData.p3 ?? 0,
                energy: parsedData.energy ?? 0,
                frequency: parsedData.frequency ?? 0,
                powerFactor: parsedData.powerFactor ?? 0,
                temperature: parsedData.temperature ?? 0,
                humidity: parsedData.humidity ?? 0,
                alarms: parsedData.alarms ?? 0
            }
        ];

        console.log("Formatted devices:", devices);
        return devices;
    } catch (error) {
        console.error("Error in maker() function:", error);
        return []; // Return an empty array on error
    }
};

module.exports = maker;

