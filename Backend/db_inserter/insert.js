//const mongoose=require("mongoose");
<<<<<<< HEAD
const User=require("../model/user");
const newuser = (voltage, current, power, energy, frequency, power_f) => {
    const user = new User({
        voltage,
        current,
        power,
        energy,
        frequency,
        power_f
    });

    // Return the promise for the save operation
    return user.save();
};

module.exports = { newuser };
=======
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

>>>>>>> e84432e (connection of backend and frontend)
