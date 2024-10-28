const WebSocket = require('ws');
const mqtt = require('mqtt');
const mongoose = require("mongoose");
const express = require('express');
const cors = require('cors');
const { newuser } = require("./db_inserter/insert.js");
const { holder } = require("./information/mqtt.js");
const key = require("./information/data_parser.js");
const maker = require("./information/parseDeviceData.js");

const app = express();
const httpPort = 8737;
const wsPort = 3027;

// Express middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// WebSocket Server
const wss = new WebSocket.Server({ port: wsPort });

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
    client.subscribe('topic7_rec', { qos: 1 }, (err) => {
        if (!err) {
            console.log("Successfully subscribed to topic7_rec");
        } else {
            console.error("Subscription error:", err);
        }
    });
});

// Handle MQTT messages
client.on("message", (topic, message) => {
    if (topic === 'topic7') {
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

            // Store data in MongoDB
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
    }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Function to fetch historical data
async function getDocumentsWithinTimeRange(startTime, endTime) {
    try {
        // Convert string dates to Date objects
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        console.log("Querying with dates:", { startDate, endDate });

        // Use mongoose model to query (assuming your model is defined in insert.js)
        const documents = await mongoose.connection.collection('users').find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).toArray();

        console.log(`Found ${documents.length} documents`);
        return documents;
    } catch (error) {
        console.error("Error retrieving documents:", error);
        throw error;
    }
}

// Historical data endpoint
app.get("/datee", async (req, res) => {
    console.log("GET request received for /datee", req.query);
    
    const { startTime, endTime } = req.query;
    
    console.log("Received request with params:", { startTime, endTime });

    if (!startTime || !endTime) {
        return res.status(400).json({
            error: "Both startTime and endTime must be provided",
            received: { startTime, endTime }
        });
    }

    try {
        const docs = await getDocumentsWithinTimeRange(startTime, endTime);

        // Extract values into separate arrays
        const voltageArray = docs.map(doc => doc.voltage);
        const currentArray = docs.map(doc => doc.current);
        const energyArray = docs.map(doc => doc.energy);
        const powerFactorArray = docs.map(doc => doc.power_f);
        const timeArray = docs.map(doc => doc.createdAt);

        // Log the data being sent
        console.log('Sending response with arrays:', {
            voltageCount: voltageArray.length,
            currentCount: currentArray.length,
            energyCount: energyArray.length,
            powerFactorCount: powerFactorArray.length,
            timeCount: timeArray.length
        });

        res.status(200).json({
            voltage: voltageArray,
            current: currentArray,
            energy: energyArray,
            powerFactor: powerFactorArray,
            time: timeArray
        });
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
});

// API endpoint for incoming data
app.post('/api/data', async (req, res) => {
    const device = req.body;
    const topic = 'topic7_rec';
    console.log(device);
    
    try {
        await client.publish(topic, JSON.stringify(device), { qos: 0 });
        console.log(`Message sent to topic "${topic}":`, device);
    } catch (err) {
        console.error('Error publishing message:', err);
        return res.status(500).json({ message: 'Error publishing message' });
    }
    
    res.json({ message: 'Data received successfully', receivedData: req.body });
});

// Start Express server
app.listen(httpPort, () => {
    console.log(`HTTP Server running on http://localhost:${httpPort}`);
});
