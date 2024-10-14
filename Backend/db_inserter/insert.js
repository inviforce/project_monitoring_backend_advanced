//const mongoose=require("mongoose");
const User = require("../model/user.js");

async function newuser(voltage, current, power, energy, frequency, powerFactor, temperature) {
    const newUser = new User({
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

module.exports = { newuser };

