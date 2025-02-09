const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    name: { type: String, required: true }
});

const dataSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    topic_name: {
        type: topicSchema, // Use a sub-schema for proper structuring
        required: true
    }
}, { timestamps: true });

const DataModel = mongoose.model('Data', dataSchema);

module.exports = DataModel;
