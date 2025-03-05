const mongoose = require("mongoose");

const cluster_preff = new mongoose.Schema({
    cluster_info: {
        host: {
            type: String,
            required: true,
            unique: true // Ensures each cluster is uniquely identified by its host
        },
        username: {
            type: String,
            required: true,
        },
        port: {
            type: Number,
            required: true,
        },
        protocol: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        topic_subs: [
            {
                topic: { type: String, required: true },
                label: { type: String, required: true }
            }
        ]
    },
    users: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true }
        }
    ]
}, { timestamps: true });

const clusterModel = mongoose.model("cluster_preff", cluster_preff);

module.exports = clusterModel;
