// const maker=function (mess){
//     let latestData={}
//     latestData = {
//         nodeId:mess.nodeId,
//         voltage: mess.voltage,
//         current: mess.current,
//         power: mess.power,
//         energy: mess.energy,
//         frequency: mess.frequency,
//         powerFactor: mess.powerFactor,  
//         temperature: mess.temperature,
//         humidity:mess.humidity,
//     };
    
//     return latestData;
// }

// module.exports=maker;

// const maker=function (mess){
//     let latestData={}
//     latestData = {
//         nodeId:mess.nodeId,
//         voltage: mess.voltage,
//         current: mess.current,
//         power: mess.power,
//         energy: mess.energy,
//         frequency: mess.frequency,
//         powerFactor: mess.powerFactor,  
//         temperature: mess.temperature,
//         humidity:mess.humidity,
//     };
    
//     return latestData;
// }

// module.exports=maker;

const maker = function(mess) {
    let messages = [];
    try {
        let parsed = JSON.parse(mess);
        // Loop for three devices.
        for (let i = 1; i <= 3; i++) {
            messages.push({
                device: `device ${i}`,
                voltage: (typeof parsed[`v${i}`] !== 'undefined') ? parsed[`v${i}`] : 0,
                current: (typeof parsed[`c${i}`] !== 'undefined') ? parsed[`c${i}`] : 0,
                power: (typeof parsed[`p${i}`] !== 'undefined') ? parsed[`p${i}`] : 0
            });
        }
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
    return messages;
};

module.exports=maker;
