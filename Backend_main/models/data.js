// const mongoose = require("mongoose");

// const dataSchema = new mongoose.Schema({
//     nodeId: {
//         type: String,
//         required: false,
//     },
//     voltage: {
//         type: Number,
//         required: true,
//     },
//     current: {
//         type: Number,
//         required: true,
//     },
//     power: {
//         type: Number,
//         required: true,
//     },
//     energy: {
//         type: Number,
//         required: true,
//     },
//     frequency: {
//         type: Number,
//         required: true,
//     },
//     power_f: {
//         type: Number,
//         required: false,
//     },
//     temperature: {
//         type: Number,
//         required: true,
//     },
//     humidity: {
//         type: Number,
//         required: false,
//     }
// }, { timestamps: true });



// const nodeData = mongoose.model('Data', dataSchema,"node_data");
// module.exports = nodeData;

const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
    device: {
        type: Number,
        required: true,
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
