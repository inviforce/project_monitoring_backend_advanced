const maker=function (mess){
    let latestData={}
    latestData = {
        nodeId:mess.nodeId,
        voltage: mess.voltage,
        current: mess.current,
        power: mess.power,
        energy: mess.energy,
        frequency: mess.frequency,
        powerFactor: mess.powerFactor,  
        temperature: mess.temperature,
        humidity:mess.humidity,
    };
    
    return latestData;
}

module.exports=maker;