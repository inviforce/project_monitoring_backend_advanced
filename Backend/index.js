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

let selectedTopic = 'topic7'; 
// MongoDB Connection
const mongodb = 'mongodb+srv://hemlatasharmasatish:lgDngzsMzj1q26bE@cluster0.4ejh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
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

    // Subscribe to multiple topics
    const topics = ['topic7', 'topic8', 'topic9', 'topic10'];
    client.subscribe(topics, { qos: 1 }, (err) => {
        if (!err) {
            console.log(`Successfully subscribed to topics: ${topics.join(', ')}`);
        } else {
            console.error('Subscription error:', err);
        }
    });

    // Also subscribe to a generic topic if needed
    client.subscribe('neoway', { qos: 1 }, (err) => {
        if (!err) {
            console.log('Successfully subscribed to neoway');
        } else {
            console.error('Subscription error:', err);
        }
    });
});

app.post('/api/data/topic', async (req, res) => {
    const { topic } = req.body;
    if (topic) {
        selectedTopic = topic; // Update the selected topic
        console.log(`Frontend selected topic: ${selectedTopic}`);
        res.status(200).send('Selected topic updated');
    } else {
        res.status(400).send('No topic provided');
    }
});

// Handle MQTT messages
client.on('message', (topic, message) => {
    try {
        const mess = maker(message.toString());
        const latestData = key(mess.deviceID, mess);

        console.log(`Message received on topic "${topic}":`, latestData);

        // Only send data to the frontend if the topic matches the selected topic
        if (topic === selectedTopic) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(latestData));
                }
            });
        }

        // Store data in MongoDB regardless of the topic
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
                    console.error('Error inserting data:', err);
                } else {
                    console.log('Data inserted successfully into MongoDB');
                }
            }
        );
    } catch (parseError) {
        console.error('Failed to parse message:', parseError);
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
    const topic = 'neoway';
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
