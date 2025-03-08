const path = require('path');
const WebSocket = require('ws')
require('dotenv').config(({path : path.resolve(__dirname, "./.env")}));
const mongoose = require("mongoose")
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const maker = require("./utilities/parseDeviceData.js");
const Data = require("./models/data.js")
const cookieParser = require("cookie-parser");
const {restrictToLoggedinUserOnly} = require("./middlewares/auth.js");
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const { mqtt_subs, clusterEmitter } = require("./mqtt_handler/mqtt_topic_list.js");
const clusterModel = require("./models/cluster_preff");
const adder=require("./mqtt_handler/topic_adder.js");
// const { createClient } = require('redis'); //

// const redisClient = createClient();
require('dotenv').config();  // Load .env variables

//const httpPort = process.env.PORT || 5000;  



// (async () => {
//     await redisClient.connect(); // ✅ Fix: Wrap in an async function
//     console.log("Connected to Redis");
// })();



const app = express();
const httpPort= process.env.PORT || 8737
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())


const userRoute = require("./routes/user.js");

app.use("/user",userRoute)

const db = process.env.MONGO_URL;



const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [ 'http://localhost:5500', 'http://127.0.0.1:5500'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle joining a room
    socket.on("joinRoom", (roomName) => {
        console.log("hey")
        console.log(roomName)
        if (!sortedClusters.includes(roomName)) {
            console.log(`Unauthorized room join attempt: ${roomName}`);
            socket.emit("errorMessage", "Invalid room name");
            return;
        }

        console.log(`Socket ${socket.id} joining room: ${roomName}`);
        socket.join(roomName);
        socket.to(roomName).emit("roomMessage", `User ${socket.id} joined ${roomName}`);
    });

    // Handle leaving a room
    socket.on("leaveRoom", (roomName) => {
        if (!sortedClusters.includes(roomName)) {
            socket.emit("errorMessage", "Invalid room name");
            return;
        }

        console.log(`Socket ${socket.id} leaving room: ${roomName}`);
        socket.leave(roomName);
        socket.to(roomName).emit("roomMessage", `User ${socket.id} left ${roomName}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

mongoose.connect(db)
    .then(() => {
        console.log("Connected to MongoDB : " , process.env.MONGO_URL);
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

 
let clusters = []; // Store latest clusters
let mqttClients = {}; // Store active MQTT clients
let subscribedClusters = new Set(); // Track subscribed clusters
let sortedClusters = []; // Global variable to hold sorted clusters

(async function () {
    clusters = await mqtt_subs();
    subscribeToAllClusters(clusters);
    updateSortedClusters(); // Initialize sorted clusters
})();

// Function to update sorted clusters
function updateSortedClusters() {
    sortedClusters = clusters
        .flatMap(cluster => {
            const host = cluster.cluster_info?.host;
            const topics = cluster.cluster_info?.topic_subs || [];

            // Only include clusters that have topics
            return topics.length > 0 
                ? topics.map(topic => `${host}_${topic.topic}`) 
                : []; // Exclude clusters without topics
        })
        .sort();

    console.log("Updated Sorted Clusters:", sortedClusters);
}

// Function to subscribe all clusters
function subscribeToAllClusters(clusters) {
    clusters.forEach(cluster => subscribeToMQTT(cluster));
}

const messageQueue = []; // Queue to hold incoming messages
const BATCH_SIZE = 50;   // Adjust batch size based on system capability
const BATCH_INTERVAL = 100; // Interval to process the queue in milliseconds

const processQueue = async () => {
    if (messageQueue.length > 0) {
        const batch = messageQueue.splice(0, BATCH_SIZE); // Take a batch of messages

        const bulkOperations = batch.map((mess) => {
            const document = { ...mess }; // Copy all properties from the message
            return { insertOne: { document } };
        });

        try {
            // Insert batch into MongoDB
            const result = await Data.bulkWrite(bulkOperations);
            console.log(`Inserted ${result.insertedCount} records successfully.`);
        } catch (err) {
            console.error("Error inserting batch into MongoDB:", err);
        }
    }
};

// Schedule the queue processor
setInterval(processQueue, BATCH_INTERVAL);

// Function to subscribe a cluster to MQTT
function subscribeToMQTT(cluster) {
    if (subscribedClusters.has(cluster._id.toString())) {
        console.log(`Already subscribed to cluster: ${cluster._id}`);
        return;
    }

    const { host, port, username, password, protocol, topic_subs } = cluster.cluster_info;

    const mqttConfig = {
        host,
        port: parseInt(port), // Ensure port is a number
        username,
        password,
        protocol
    };

    const client = mqtt.connect(`mqtts://${host}`, mqttConfig);

    client.on("connect", () => {
        console.log(`Connected to MQTT Broker: ${host}:${port}`);

        // Extract topic strings from topic_subs
        if (Array.isArray(topic_subs) && topic_subs.length > 0) {
            topic_subs.forEach(({ topic }) => {
                if (topic) {
                    client.subscribe(topic, (err) => {
                        if (err) {
                            console.error(`Failed to subscribe to topic ${topic} on ${host}:`, err);
                        } else {
                            console.log(`Subscribed to ${topic} on ${host}`);
                        }
                    });
                } else {
                    console.error(`Invalid topic in topic_subs for cluster ${cluster._id}`);
                }
            });
        } else {
            console.log(`No topics to subscribe for cluster: ${cluster._id}`);
        }
    });

    client.on("message", (topic, message) => {
        if(topic==="neoway"){
            return;
        }
        let mess = maker(message.toString());
        mess.host = host;
        mess.topic = topic;
        console.log(mess);
        messageQueue.push(mess);
        console.log(`Message received on ${topic} from ${host}: ${message.toString()}`);

        // Construct the room name: `host_topic`
        const roomName = `${host}_${topic}`;

        // Only emit the message if the room exists
        if (sortedClusters.includes(roomName)) {
            console.log(`Forwarding MQTT message to room: ${roomName}`);
            io.to(roomName).emit("roomMessage", mess);
        } else {
            console.log(`Ignoring message, room ${roomName} is not in sortedClusters`);
        }
    });

    client.on("error", (err) => {
        console.error(`MQTT Error for cluster ${cluster._id}:`, err);
    });

    client.on("close", () => {
        console.log(`Disconnected from ${host}`);
    });

    mqttClients[cluster._id] = client;
    subscribedClusters.add(cluster._id.toString());
}

// Function to unsubscribe a cluster
function unsubscribeFromMQTT(clusterId) {
    if (mqttClients[clusterId]) {
        mqttClients[clusterId].end();
        delete mqttClients[clusterId];
        subscribedClusters.delete(clusterId);
        console.log(`MQTT Client disconnected for cluster: ${clusterId}`);
    }
}

// Listen for real-time cluster updates
clusterEmitter.on("clustersUpdated", (updatedClusters) => {
    console.log("Clusters Updated in Backend:", updatedClusters);
    
    // Subscribe new clusters
    updatedClusters.forEach(cluster => {
        if (!subscribedClusters.has(cluster._id.toString())) {
            subscribeToMQTT(cluster);
        }
    });

    // Unsubscribe removed clusters
    const updatedClusterIds = new Set(updatedClusters.map(c => c._id.toString()));
    Object.keys(mqttClients).forEach(clusterId => {
        if (!updatedClusterIds.has(clusterId)) {
            unsubscribeFromMQTT(clusterId);
        }
    });

    // Update local clusters list
    clusters = updatedClusters;
    
    // Update sorted clusters when topics change
    updateSortedClusters();
});

function publishToMQTT(cluster, topic, message) {
    console.log("Publishing to MQTT:", cluster, topic, message);

    const { host, port, username, password, protocol } = cluster;

    const mqttConfig = {
        host,
        port: parseInt(port),
        username,
        password,
        protocol
    };

    const client = mqtt.connect(`mqtts://${host}`, mqttConfig);

    client.on("connect", () => {
        console.log(`Connected to MQTT Broker: ${host}:${port}`);

        client.publish(topic, message, { qos: 1 }, (err) => {
            if (err) {
                console.error(`Failed to publish message to ${topic} on ${host}:`, err);
            } else {
                console.log(`Message published to ${topic} on ${host}:`, message);
            }

            // Close connection after publishing
            console.log(`Disconnecting from ${host}`);
            client.end();
        });
    });

    client.on("error", (err) => {
        console.error(`MQTT Error for cluster ${host}:`, err);
        client.end(); // Ensure cleanup on error
    });

    client.on("close", () => {
        console.log(`Disconnected from ${host}`);
    });
}



app.post("/api/topic_name", async (req, res) => {
    const { topic, name,userEmail } = req.body;

    if (!topic || !name) {
        return res.status(400).json({ error: "Missing 'topic' or 'name' in the request body." });
    }

    console.log("Received Data:", { topic, name });
    await adder(userEmail,topic,name)
    
    // Respond back to the clients
    res.status(200).json({ message: "Data received successfully", topic, name,userEmail });
});

app.post('/api/topic', async (req, res) => {
    const { topic } = req.body;
    if (topic) {
        selectedTopic = topic; // Update the selected topic
        console.log(`Frontend selected topic: ${selectedTopic}`);
        res.status(200).send('Selected topic updated');
    } else {
        res.status(400).send('No topic provided');
    }
});

app.post('/api/topic/phase', async (req, res) => {
    const { phase } = req.body;
    if (phase) {
        selectedphase = phase; // Update the selected topic
        console.log(`Frontend selected: ${phase}`);
        res.status(200).send('Selected topic updated');
    } else {
        res.status(400).send('No topic provided');
    }
});

app.post("/api/getUserTopics", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Fetch clusters where the user is part of the `users` array
        const clusters = await clusterModel.find({ "users.email": email });

        if (!clusters || clusters.length === 0) {
            return res.status(404).json({ error: "No clusters found for this user" });
        }

        // Extract only the `label` from topic_subs safely
        const labels = clusters.flatMap(cluster => 
            cluster.cluster_info?.topic_subs?.map(sub => sub.label) || []
        );

        return res.json({ labels });
    } catch (error) {
        console.error("Error fetching labels for user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


app.post("/api/data", async (req, res) => {
    try {
        const { email, deviceId, status } = req.body;

        if (!email || !deviceId || !status) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find the user's cluster
        const clust = await clusterModel.findOne({ "users.email": email });

        if (!clust || !clust.cluster_info) {
            return res.status(404).json({ error: "Cluster not found for the user" });
        }

        // Send message to MQTT
        let zey=`${req.body.deviceId} ${req.body.status}`
        await publishToMQTT(clust.cluster_info, "neoway", zey);

        return res.status(200).json({ message: "AC status updated and sent to MQTT" });
    } catch (error) {
        console.error("Error in /api/data:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


app.use(express.static(path.join(__dirname, "../")));

app.set("view engine", "ejs");
app.set("views", path.resolve("./Backend_main/views"));

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/vidyut.html"));
});

app.get("/home",(req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/home1.html"));
});

app.get("/schedule",(req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/schedule.html"));
})
app.get("/auto",(req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/auto.html"));
})

app.get("/discography", restrictToLoggedinUserOnly ,(req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/discography.html"));
});

app.get("/discography/:label/:email", restrictToLoggedinUserOnly, async (req, res) => {
    let subscribedLabel = req.params.label.replace(/_/g, " "); // Convert underscores to spaces
    let email = req.params.email; // Capture the email

    console.log("User subscribed label:", subscribedLabel);
    console.log("User email:", email);

    try {
        // Find the cluster where the user is subscribed to the given label
        const cluster = await clusterModel.findOne({
            "cluster_info.topic_subs.label": subscribedLabel,
            "users.email": email
        });

        if (!cluster) {
            return res.status(404).send("Subscription not found. Please subscribe first.");
        }

        // Serve the frontend page
        res.sendFile(path.join(__dirname, "../Frontend/index.html"));

    } catch (error) {
        console.error("Error checking subscription:", error);
        res.status(500).send("Internal Server Error");
    }
});

// New API to fetch subscription details dynamically
app.get("/api/user-subscription/:label/:email", restrictToLoggedinUserOnly, async (req, res) => {
    let subscribedLabel = req.params.label.replace(/_/g, " "); 
    let email = req.params.email;

    try {
        const cluster = await clusterModel.findOne({
            "cluster_info.topic_subs.label": subscribedLabel,
            "users.email": email
        });

        if (!cluster) {
            return res.status(404).json({ error: "Subscription not found." });
        }

        const topicInfo = cluster.cluster_info.topic_subs.find(t => t.label === subscribedLabel);
        const host = cluster.cluster_info.host;
        const topic = topicInfo?.topic || "Unknown Topic";
        console.log({ host, topic })
        res.json({ host, topic });
    } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



app.get("/discography/Adder", restrictToLoggedinUserOnly,(req,res)=>{
    
    res.sendFile(path.join(__dirname, "../Frontend/add.html"));
});

app.get("/home/map",(req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/map.html"));
});

app.get("/register", (req, res) => {
    res.render("register"); // Ensure 'register.ejs' exists in your views folder
});

app.get("/login", (req, res) => {
    res.render("index");
});

app.get("/forgot" , (req,res) => {
    res.render("forgot")
});

app.get('/time', (req, res) => {
    const serverTime = new Date().toISOString();
    res.json({ serverTime });
});

server.listen(httpPort, () => {
    console.log(`HTTP & WebSocket Server running on http://localhost:${httpPort}`);
});
