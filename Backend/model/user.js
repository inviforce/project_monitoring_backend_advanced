const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
    deviceId:{
        type:String,
        required:true,
    },
    voltage: {
        type: Number,
        required: true,
    },
    current: {
        type: Number,
        required: true,
    },
    power: {
        type: Number,
        required: true,
    },
    energy: {
        type: Number,
        required: true,
    },
    frequency: {
        type: Number,
        required: true,
    },
    power_f: {
        type: Number,
        required: true,
    },
    temperature: {
        type: Number,
        required: true,
    }
});

const User = mongoose.model('User', userschema);
module.exports = User;
