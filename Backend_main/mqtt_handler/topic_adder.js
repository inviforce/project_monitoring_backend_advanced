const mongoose = require("mongoose");
const clusterModel = require("../models/cluster_preff");

async function adder(email, topic, name) {
    try {
        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect("mongodb+srv://hemlatasharmasatish:lgDngzsMzj1q26bE@cluster0.4ejh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log("Connected to MongoDB.");
        }

        // Find the cluster where the user exists
        const cluster = await clusterModel.findOne({ "users.email": email });

        if (!cluster) {
            console.log("Cluster not found for this user.");
            return { success: false, message: "Cluster not found" };
        }

        // Ensure topic_subs is initialized as an array
        if (!Array.isArray(cluster.cluster_info.topic_subs)) {
            cluster.cluster_info.topic_subs = [];
        }

        // Add the new topic
        cluster.cluster_info.topic_subs.push({ topic, label: name });

        // Save changes to MongoDB
        await cluster.save();

        console.log("Topic added successfully!");
        return { success: true, message: "Topic added successfully" };

    } catch (error) {
        console.error("Error adding topic:", error);
        return { success: false, message: "Error adding topic", error };
    }
}

// Export the function
//adder("deepak","topic7","machine_lab")
module.exports = adder;
