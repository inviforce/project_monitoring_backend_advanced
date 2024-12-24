//const mongoose=require("mongoose");
const Data = require("/mnt/503237F73237E0A0/SahilGuptaCodingFiles/power_monitoring/model/data.js");

async function newData(nodeId,voltage, current, power, energy, frequency, powerFactor, temperature) {
    const newUser = new Data({
        nodeId:nodeId,
        voltage: voltage,
        current: current,
        power: power,
        energy: energy,
        frequency: frequency,
        power_f: powerFactor, // Ensure this matches your schema
        temperature: temperature
    });

    try {
        await newUser.save();  // No callback, using await
        console.log("Data inserted successfully into MongoDB");
    } catch (err) {
        console.error("Error inserting data:", err);
    }
}

module.exports = { newData };

