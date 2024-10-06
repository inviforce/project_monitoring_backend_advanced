const WebSocket = require('ws');
const mqtt = require('mqtt');
const mongoose = require("mongoose");
const { newuser } = require("./db_inserter/insert.js");

const PORT = 3027;
const wss = new WebSocket.Server({ port: PORT });

const mongodb = 'mongodb://127.0.0.1:27017/prj';
mongoose.connect(mongodb)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

const client = mqtt.connect({
    host: 'befc1420952d4ab8b4b9284843b122b9.s1.eu.hivemq.cloud',
    port: 8883,
    username: 'someone',
    password: 'some123somE',
    protocol: 'mqtts'
});

client.on('connect', () => {
    console.log('Connected to HiveMQ broker');
    client.subscribe('topic_7', { qos: 1 }, (err) => {
        if (!err) {
            console.log("Successfully subscribed to topic_7");
        } else {
            console.error("Subscription error:", err);
        }
    });
});

client.on("message", (topic, message) => {
    try {
        const mess = JSON.parse(message.toString());
        const latestData = {
            voltage: mess.voltage,
            current: mess.current,
            power: mess.power,
            energy: mess.energy,
            frequency: mess.frequency,
            power_f: mess.power_f,
        };
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(latestData));
            }
        });
        // Store the data in MongoDB
        newuser(
            mess.voltage,
            mess.current,
            mess.power,
            mess.energy,
            mess.frequency,
            mess.power_f,
            (err) => {
                if (err) {
                    console.error("Error inserting data:", err);
                    return;
                }
                console.log("Data inserted successfully into MongoDB");
                // Broadcast new data to all connected WebSocket clients
            }
        );
    } catch (parseError) {
        console.error("Failed to parse message:", parseError);
    }
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

