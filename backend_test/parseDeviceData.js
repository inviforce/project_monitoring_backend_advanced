const parser=function(input){
    const data = input.replace('*', '').split('-');

    // Check if the number of elements is as expected (e.g., 9 parts)
    if (data.length !== 9) {
        throw new Error(`Unexpected data format: ${input}`);
    }
    
    // Create an object with the extracted values
    let nodeData
    // if(data[0]="SEG0001"){
        nodeData = {
            nodeId: data[0],
            voltage: parseFloat(data[3]),
            current: parseFloat(data[4]),
            power: parseFloat(data[5]),
            energy: parseFloat(data[6]),
            frequency: parseFloat(data[7]),
            temperature: parseFloat(data[1]),
            power_f: parseFloat(data[8]),
            humidity: parseFloat(data[2]),
           
            
           
           
        };
    // }

    return nodeData;
}
// console.log((parser("SEG0001-28.29-41.17-230.00-0.00-0.00-0.53-49.90-0.00*")))

module.exports=parser
  