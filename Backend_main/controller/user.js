const path = require("path");
const User = require("../models/user");
const {v4 : uuidv4} = require('uuid')
const {setUser} = require("../service/auth")
const mqtt = require('mqtt');

const clusterModel = require("../models/cluster_preff"); // Import the updated model

async function handleUserSignup(req, res) {
    try {
        const { 
            name, 
            email, 
            password, 
            mqtt_host, 
            mqtt_port, 
            mqtt_username, 
            mqtt_password, 
            mqtt_protocol 
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        // MQTT connection configuration
        const mqttConfig = {
            host: mqtt_host,
            port: parseInt(mqtt_port), // Ensure port is a number
            username: mqtt_username,
            password: mqtt_password,
            protocol: mqtt_protocol
        };

        console.log(`Attempting to connect to MQTT broker: ${mqtt_host}`);

        // Create MQTT client with object-based configuration
        const mqttClient = mqtt.connect(mqttConfig);

        // Wrap MQTT connection in a Promise for async handling
        const mqttConnection = new Promise((resolve, reject) => {
            mqttClient.on("connect", () => {
                console.log("✅ Connected to MQTT broker successfully!");
                mqttClient.end(); // Disconnect immediately
                resolve(true);
            });

            mqttClient.on("error", (err) => {
                console.error("❌ MQTT connection failed:", err.message);
                mqttClient.end();
                reject(new Error("Failed to connect to MQTT broker."));
            });
        });

        // Wait for MQTT connection attempt
        await mqttConnection;

        // Check if the cluster already exists
        let existingCluster = await clusterModel.findOne({ "cluster_info.host": mqtt_host });

        if (existingCluster) {
            // Check if the user already exists within this cluster
            const userExists = existingCluster.users.some(user => user.email === email);

            if (userExists) {
                console.log("User already exists in the cluster!");
                return res.status(400).json({ error: "User already registered in this cluster." });
            } else {
                // Add the new user to the existing cluster
                existingCluster.users.push({ name, email, password });
                await existingCluster.save();
                console.log("User added to existing cluster successfully!");
            }
        } else {
            // Create a new cluster and add the user
            existingCluster = await clusterModel.create({
                cluster_info: mqttConfig, // Store the entire config
                users: [{ name, email, password }]
            });

            console.log("New cluster created, and user registered successfully!");
        }

        return res.redirect("/");
    } catch (error) {
        console.error("Error during user signup:", error.message);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

async function handleUserLogin(req, res) {
    try {
        const { email, password } = req.body;

        // Find the cluster that contains the user
        const cluster = await clusterModel.findOne({ "users.email": email });

        if (!cluster) {
            return res.render("index", {
                error: "Invalid email or password",
            });
        }

        // Find the user within the cluster
        const user = cluster.users.find(user => user.email === email && user.password === password);

        if (!user) {
            return res.render("index", {
                error: "Invalid email or password",
            });
        }

        // Create a session
        const sessionId = uuidv4();
        setUser(sessionId, user);
        
        // Set session cookies
        res.cookie("uid", sessionId);
        res.cookie("email", email);
        
        return res.redirect("/");
    } catch (error) {
        console.error("Error during user login:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    handleUserSignup,
    handleUserLogin,
};