const WebSocket = require('ws');
const mqtt = require('mqtt');
const mongoose = require("mongoose");
const { newuser } = require("./db_inserter/insert.js");
const { holder } = require("./information/mqtt.js");
const key = require("./information/data_parser.js");
const maker = require("./information/parseDeviceData.js");
const express = require('express');
const cors = require('cors');

const app = express();
const httpPort = 8737;
const wsPort = 3027; 
const wss = new WebSocket.Server({ port: wsPort });

app.use(cors()); 
app.use(express.json()); 

app.post('/api/data', (req, res) => {
    const device = req.body;
    const topic = 'topic7'; // Define the topic

    client.publish(topic, JSON.stringify(device), { qos: 1 }, (err) => {
        if (err) {
            console.error('Error publishing message:', err);
        } else {
            console.log(`Message sent to topic "${topic}":`, device);
        }
    });

    res.json({ message: 'Data received successfully', receivedData: req.body });
});

// Start Express server
app.listen(httpPort, () => {
    console.log(`HTTP Server running on http://localhost:${httpPort}`);
});

// MongoDB Connection
const mongodb = 'mongodb://127.0.0.1:27017/prj';
mongoose.connect(mongodb)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

// MQTT Client Setup
const client = mqtt.connect({
    host: holder.host,
    port: holder.port,
    username: holder.username,
    password: holder.password,
    protocol: holder.protocol
});

// Handle MQTT connection
client.on('connect', () => {
    console.log('Connected to HiveMQ broker');
    client.subscribe('topic7', { qos: 1 }, (err) => {
        if (!err) {
            console.log("Successfully subscribed to topic7");
        } else {
            console.error("Subscription error:", err);
        }
    });
});

// Handle MQTT messages
client.on("message", (topic, message) => {
    if (topic !== 'topic7') {
        console.warn(`Unexpected topic received: ${topic}`);
        return;
    }
    
    try {
        const mess = maker(message.toString());
        const latestData = key(mess.deviceID, mess);
        
        // Log and send data via WebSocket
        console.log(latestData);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(latestData));
            }
        });

        newuser(
            mess.deviceID,
            mess.voltage,
            mess.current,
            mess.power,
            mess.energy,
            mess.frequency,
            mess.powerFactor,
            mess.temperature,
            (err) => {
                if (err) {
                    console.error("Error inserting data:", err);
                } else {
                    console.log("Data inserted successfully into MongoDB");
                }
            }
        );
    } catch (parseError) {
        console.error("Failed to parse message:", parseError);
    }
});

wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server is running on ws://localhost:${wsPort}`);
