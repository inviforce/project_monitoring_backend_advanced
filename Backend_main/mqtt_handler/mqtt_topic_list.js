const mongoose = require("mongoose");
const clusterModel = require("../models/cluster_preff"); // Import the updated model
const { EventEmitter } = require("events");

const clusterEmitter = new EventEmitter(); // Event emitter for real-time updates
let clusters = []; // Store the latest cluster data

async function mqtt_subs() {
    try {
        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect("mongodb+srv://hemlatasharmasatish:lgDngzsMzj1q26bE@cluster0.4ejh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log("Connected to MongoDB.");
        }

        // Fetch initial clusters
        clusters = await clusterModel.find({});
        console.log("Initial Clusters Loaded:", clusters);

        // Watch the collection for changes
        const changeStream = clusterModel.watch();

        changeStream.on("change", async (change) => {
            console.log("Change detected:", change);

            if (["insert", "update", "delete"].includes(change.operationType)) {
                // Refresh the clusters array with the latest data
                clusters = await clusterModel.find({});
                console.log("Updated Clusters:", clusters);

                // Emit event with updated clusters
                clusterEmitter.emit("clustersUpdated", clusters);
            }
        });

        return clusters; // Return the initial clusters
        
    } catch (error) {
        console.error("Can't extract data from MongoDB:", error);
        return null;
    }
}

// Export the function and the event emitter
module.exports = { mqtt_subs, clusterEmitter };
