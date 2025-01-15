const parser=function(input){
    const data = input.replace('*', '').split('-');

    // Check if the number of elements is as expected (e.g., 9 parts)
    if (data.length !== 9) {
        throw new Error(`Unexpected data format: ${input}`);
    }
    
    // Create an object with the extracted values
    let deviceData
    if(data[0]="SEG0001"){
        deviceData = {
            deviceID: data[0],
            temperature: parseFloat(data[1]),
            humidity: parseFloat(data[2]),
            voltage: parseFloat(data[3]),
            current: parseFloat(data[4]),
            power: parseFloat(data[5]),
            energy: parseFloat(data[6]),
            frequency: parseFloat(data[7]),
            powerFactor: parseFloat(data[8])
        };
    }

    return deviceData;
}

module.exports=parser
