//const mongoose=require("mongoose");
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
