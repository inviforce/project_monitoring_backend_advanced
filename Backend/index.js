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

// Function to parse the incoming device data
function parseDeviceData(input) {
    // Remove the last '*' character and split by '-'
    const data = input.replace('*', '').split('-');

    // Check if the number of elements is as expected (e.g., 9 parts)
    if (data.length !== 9) {
        throw new Error(`Unexpected data format: ${input}`);
    }
    
    // Create an object with the extracted values
    const deviceData = {
        deviceID: data[0],
        temperature: parseFloat(data[1]),
        humidity: parseFloat(data[2]),
        voltage: parseFloat(data[3]),
        current: parseFloat(data[4]),
        power: parseFloat(data[5]),
        energy: parseFloat(data[6]),
        frequency: parseFloat(data[7]),
        powerFactor: parseFloat(data[8])
    };

    return deviceData;
}

// MQTT client setup
const client = mqtt.connect({
    host: 'http://e800a45536b84764b7075bdc33165c5a.s1.eu.hivemq.cloud/',
    port: 8883,
    username: 'hellomqtt',
    password: 'Hello@123',
    protocol: 'mqtts'
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
    // Ensure we're processing the correct topic
    if (topic !== 'topic7') {
        console.warn(`Unexpected topic received: ${topic}`);
        return;
    }
    
    try {
        // Parse the incoming message
        const mess = parseDeviceData(message.toString());

        // Prepare the latest data to send via WebSocket
        const latestData = {
            voltage: mess.voltage,
            current: mess.current,
            power: mess.power,
            energy: mess.energy,
            frequency: mess.frequency,
            powerFactor: mess.powerFactor,  
            temperature: mess.temperature
        };
        //console.log(latestData)
        // Send the latest data to all WebSocket clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(latestData));
            }
        });

        // Store the parsed data in MongoDB
        newuser(
            mess.voltage,
            mess.current,
            mess.power,
            mess.energy,
            mess.frequency,
            mess.powerFactor,
            mess.temperature,  // Ensure temperature is passed here
            (err) => {
                if (err) {
                    console.error("Error inserting data:", err);
                    return;
                }
                console.log("Data inserted successfully into MongoDB");
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