const WebSocket = require('ws')
const mongoose = require("mongoose")
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const path = require('path');
const maker = require("./utilities/parseDeviceData.js");
const Data = require("./models/data.js")
const cookieParser = require("cookie-parser");
const {restrictToLoggedinUserOnly} = require("./middlewares/auth.js");
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const { mqtt_subs, clusterEmitter } = require("./mqtt_handler/mqtt_topic_list.js");
const clusterModel = require("./models/cluster_preff");

const app = express();
const httpPort = 8737;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())


const userRoute = require("./routes/user.js");

app.use("/user",userRoute)

const db = 'mongodb+srv://hemlatasharmasatish:lgDngzsMzj1q26bE@cluster0.4ejh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// const db = 'mongodb://127.0.0.1:27017/power_monitoring?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.7'

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("message",(data)=>{
        console.log(data)
    })
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


mongoose.connect(db)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

 
let clusters = []; // Store latest clusters
let mqttClients = {}; // Store active MQTT clients
let subscribedClusters = new Set(); // Track subscribed clusters
    
(async function () {
    clusters = await mqtt_subs();
    subscribeToAllClusters(clusters);
})();
    
    // Function to subscribe all clusters
function subscribeToAllClusters(clusters) {
    clusters.forEach(cluster => subscribeToMQTT(cluster));
}
    
    // Function to subscribe a cluster to MQTT
function subscribeToMQTT(cluster) {
    if (subscribedClusters.has(cluster._id.toString())) {
        console.log(`Already subscribed to cluster: ${cluster._id}`);
        return;
    }
    
    const { host, port, username, password, protocol } = cluster.cluster_info;
    
    const mqttConfig = {
        host,
        port: parseInt(port), // Ensure port is a number
        username,
        password,
        protocol
    };
    
    const client = mqtt.connect(mqttConfig);
    
    client.on("connect", () => {
        console.log(`Connected to MQTT Broker: ${host}:${port}`);
    });
    
    client.on("error", (err) => {
        console.error(`MQTT Error for cluster ${cluster._id}:`, err);
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
});
    


app.post("/api/topic_name", async (req, res) => {
    const { topic, name,userEmail } = req.body;

    if (!topic || !name) {
        return res.status(400).json({ error: "Missing 'topic' or 'name' in the request body." });
    }

    console.log("Received Data:", { topic, name });
    
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

app.use(express.static(path.join(__dirname, "../")));

app.set("view engine", "ejs");
app.set("views", path.resolve("./Backend_main/views"));

// creating api routes
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

app.get("/discography/Adhrit_Lab", restrictToLoggedinUserOnly,(req,res)=>{
    
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
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
