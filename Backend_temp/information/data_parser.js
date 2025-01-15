const maker=function (deviceID,mess){
    let latestData={}
    if(deviceID=="SEG0001"){
        latestData = {
            deviceId:mess.deviceID,
            voltage: mess.voltage,
            current: mess.current,
            power: mess.power,
            energy: mess.energy,
            frequency: mess.frequency,
            powerFactor: mess.powerFactor,  
            temperature: mess.temperature,
            humidity:mess.humidity,
        };
    }
    return latestData;
}

module.exports=maker;