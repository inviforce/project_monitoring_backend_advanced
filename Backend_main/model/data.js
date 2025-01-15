const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
    nodeId: {
        type: String,
        required: false,
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
        required: false,
    },
    temperature: {
        type: Number,
        required: true,
    },
    humidity: {
        type: Number,
        required: false,
    }
}, { timestamps: true });



const nodeData = mongoose.model('Data', dataSchema,"node_data");
module.exports = nodeData;
