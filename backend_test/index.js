const WebSocket = require('ws')
const mongoose = require("mongoose")
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
// const { newData } = require("./db_inserter/insert.js");     *********** DO IN CODE ALREADY ******************
const { holder } = require("./utilities/mqtt.js");
// const key = require("./utilities/data_parser.js");   ************NOT REQUIRED AS MAKER AND KEY IS DOING SAME WORK*************
const maker = require("./utilities/parseDeviceData.js");
const Data = require("../model/data.js")


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

class Node {
    // Constructor to initialize node properties
    constructor(nodeId, voltage = null, current = null,power_f = null,energy = null,power = null,frequency = null,temperature = null,humidity = null,topic = null) {
        this.nodeId = nodeId; // Unique identifier for the node
        this.voltage = voltage; // Voltage value of the node
        this.current = current; // Current value of the node
        this.power_f = power_f;
        this.energy = energy;
        this.power = power;
        this.frequency = frequency;
        this.temperature = temperature;
        this.humidity = humidity;
        this.topic = topic;
        // this.temp_arr = [];
        // this.humidity_arr = [];
        this.features = []

        this.initialze_features();
        
    }
    initialze_features(){
        if (this.nodeId !== null) this.features.push("nodeId") // not required
        if (this.voltage !== null) this.features.push('voltage');
        if (this.current !== null) this.features.push('current');
        if (this.power_f !== null) this.features.push('power_f');
        if (this.energy !== null) this.features.push('energy');
        if (this.power !== null) this.features.push('power');
        if (this.frequency !== null) this.features.push('frequency');
        if (this.temperature !== null) this.features.push('temperature');
        if (this.humidity !== null) this.features.push('humidity');
        if (this.topic != null) this.features.push("topic");
    }


    // method to update values
    // updateValues(mess) {
    //     for (const feature of this.features) {
    //         if (mess.hasOwnProperty(feature)) {
    //             this[feature] = mess[feature];
    //         }
    //     }
    // }
    


    // Method to display node information
    display_info() {
        console.log(`Node ID: ${this.nodeId}`);
        console.log(`Voltage: ${this.voltage} V`);
        console.log(`Current: ${this.current} A`);
        console.log(`Power_Factor: ${this.power_f} `);
        console.log(`Energy: ${this.energy}`);
        console.log(`Power: ${this.power} `);
        console.log(`Frequency: ${this.frequency}`);
        console.log(`Temperature: ${this.temperature} `);
        console.log(`Humidity: ${this.humidity}`);
        console.log(this.features);
        
    }
    // Static method to create a Node from an object
    static fromObject({ nodeId, voltage, current,power_f,energy,power,frequency,temp,humidity }) {
        return new Node(nodeId, voltage, current,power_f,energy,power,frequency,temp,humidity);
    }
}



// const db = 'mongodb+srv://hemlatasharmasatish:lgDngzsMzj1q26bE@cluster0.4ejh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const db = 'mongodb://127.0.0.1:27017/power_monitoring?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.7'

mongoose.connect(db)
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


// enter topics and nodes we have used
topics = ["topic7","topic8","topic9","topic10"]
const nodes = {
    SEG001: new Node('SEG001', true, true, true, true, true, true, true, true),
    SEG002: new Node('SEG002', true, true, true, true, true, true, true, true),
    SEG003: new Node('SEG003', true, true, true, true, true, true, true, true),
    SEG004: new Node('SEG004', true, true, true, true, true, true, ),
};

console.log(nodes.SEG001.features)
console.log(nodes.SEG004.features)



const nodeMap = {
    SEG001: "topic1",
    SEG002: "topic2",
    SEG003: "topic3",
    SEG004: "topic4"
};




                                                /******** CHANGED **********/ 
// Handle MQTT connection : connect to all availbale topics
client.on('connect', () => {
    console.log('Connected to HiveMQ broker');
    for (const topic of topics){
        client.subscribe(topic, { qos: 1 }, (err) => {
            if (!err) {
                console.log("Successfully subscribed to ",topic);
            } else {
                console.error("Subscription error:", err);
            }
        });
        
    }
    client.subscribe('neoway', { qos: 1 }, (err) => {
        if (!err) {
            console.log("Successfully subscribed to neoway");
        } else {
            console.error("Subscription error:", err);
        }
    });

    
});
// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Handle MQtt messages
                                             /*********** CHANGED **************/ 
const messageQueue = []; // Queue to hold incoming messages
const BATCH_SIZE = 50;   // Adjust batch size based on system capability
const BATCH_INTERVAL = 100; // Interval to process the queue in milliseconds

// Function to process and insert data into MongoDB
// const processQueue = async () => {
//     if (messageQueue.length > 0) {
//         const batch = messageQueue.splice(0, BATCH_SIZE); // Take a batch of messages
//         const bulkOperations = batch.map((mess) => ({
//             insertOne: {
//                 document: {
//                     nodeId: mess.nodeId,
//                     voltage: mess.voltage,
//                     current: mess.current,
//                     power: mess.power,
//                     energy: mess.energy,
//                     frequency: mess.frequency,
//                     power_f: mess.power_f,
//                     temperature: mess.temperature,
//                     humidity: mess.humidity,
//                 }
//             }
//         }));

//         try {
//             // Insert batch into MongoDB
//             const result = await Data.bulkWrite(bulkOperations);
//             console.log(`Inserted ${result.insertedCount} records successfully.`);
//         } catch (err) {
//             console.error("Error inserting batch into MongoDB:", err);
//         }
//     }
// };

// // Schedule the queue processor
// setInterval(processQueue, BATCH_INTERVAL);

// // Handle incoming MQTT messages
// client.on("message", (topic,message) => {
//     try {
//         const mess = maker(message.toString()); // Process the incoming message
//         console.log(mess);
//         messageQueue.push(mess); // Add message to the queue


//         // Optionally broadcast via WebSocket
//         // const latestData = key(mess);
//         wss.clients.forEach(client => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(JSON.stringify({ data: mess })); // Only send processed data 
//             }
//         });
//     } catch (parseError) {
//         console.error("Failed to parse message:", parseError);
//     }
// });
// Function to process and insert data into MongoDB
const processQueue = async () => {
    if (messageQueue.length > 0) {
        const batch = messageQueue.splice(0, BATCH_SIZE); // Take a batch of messages

        const bulkOperations = batch.map((mess) => {
            // console.log(mess.nodeId)
            const nodeObject = nodes[mess.nodeId]; // Retrieve the object for the nodeId
            // console.log(nodeObject)
            if (!nodeObject) {
                console.error(`Node object for ID ${mess.nodeId} not found.`);
                return null;
            }

            // Build the document based on the features array
            const document = {};
            for (const feature of nodeObject.features) {
                if (mess.hasOwnProperty(feature)) {
                    document[feature] = mess[feature];
                }
            }
            document.nodeId = mess.nodeId; // Always include the nodeId

            return {
                insertOne: { document }
            };
        }).filter(op => op !== null); // Remove any null operations

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

// Handle incoming MQTT messages
client.on("message", (topic, message) => {
    try {
        const mess = maker(message.toString()); // Process the incoming message
        console.log(mess);
        messageQueue.push(mess); // Add message to the queue

        // Optionally broadcast via WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ data: mess })); // Only send processed data
            }
        });
    } catch (parseError) {
        console.error("Failed to parse message:", parseError);
    }
});


// Function to fetch historical data
async function getDocumentsWithinTimeRange(nodeId,startTime, endTime) {
    try {
        // Convert string dates to Date objects
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        console.log("Querying with dates:", { startDate, endDate });

        // Use mongoose model to query (assuming your model is defined in insert.js)
        const documents = await Data.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
            nodeId: nodeId // Add this line to filter by nodeId
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
    
    const {nodeId, startTime, endTime } = req.query;
    
    console.log("Received request with params:", {nodeId, startTime, endTime });

    if (!nodeId || !startTime || !endTime) {
        return res.status(400).json({
            error: "Both startTime and endTime must be provided",
            received: {nodeId, startTime, endTime }
        });
    }

    try {
        const docs = await getDocumentsWithinTimeRange(nodeId,startTime, endTime);

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
    const data = req.body;
    const topic = 'neoway';
    console.log(data);
    
    try {
        await client.publish(topic, JSON.stringify(data), { qos: 0 });
        console.log(`Message sent to topic "${topic}":`, data);
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
