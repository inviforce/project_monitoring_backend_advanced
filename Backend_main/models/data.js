const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
    host: {
        type: String,
        required: true,
    },
    device:{
        type:Number,
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
    powerFactor: {
        type: Number,
        required: true,
    },
    alarms: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

const NodeData = mongoose.model('NodeData', dataSchema, "node_data");
module.exports = NodeData;
