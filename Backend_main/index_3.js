const WebSocket = require('ws')
const mongoose = require("mongoose")
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const path = require('path');
// const { newData } = require("./db_inserter/insert.js");     *********** DO IN CODE ALREADY ******************
const { holder } = require("./utilities/mqtt.js");
// const key = require("./utilities/data_parser.js");   ************NOT REQUIRED AS MAKER AND KEY IS DOING SAME WORK*************
const maker = require("./utilities/parseDeviceData.js");
const Data = require("./models/data.js")
const cookieParser = require("cookie-parser");
const {restrictToLoggedinUserOnly} = require("./middlewares/auth.js");
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const httpPort = 8737;
const wsPort=3727


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

const userRoute = require("./routes/user.js");

app.use("/user",userRoute)

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



let topics 
let email
try {
    const data = fs.readFileSync('Backend_main/info.txt', 'utf8'); 
    topics = data.split("\n").map(topic => topic.trim()).filter(topic => topic !== ""); // Remove extra spaces and empty lines
    console.log(topics); // Output: ["topic7", "topic8", "topic9", "topic10"]
} catch (err) {
    console.error("Error reading file:", err);
}

console.log(topics)

// Express middleware


let selectedTopic = 'topic7';
let selectedphase= 1;

// WebSocket Server
const wss = new WebSocket.Server({ port: wsPort });

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New clients connected');
    ws.on('close', () => {
        console.log('clients disconnected');
    });
});

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

const db = 'mongodb+srv://hemlatasharmasatish:lgDngzsMzj1q26bE@cluster0.4ejh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// const db = 'mongodb://127.0.0.1:27017/power_monitoring?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.7'

mongoose.connect(db)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });





// // MQTT Client Setup
// const client = mqtt.connect({
//     host: holder.host,
//     port: holder.port,
//     username: holder.username,
//     password: holder.password,
//     protocol: holder.protocol
// });

const clients = []; // Use an array instead of an object

// Loop through client configurations and connect
holder.clients.forEach((config, index) => {
    const client = mqtt.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        protocol: config.protocol
    });

    clients.push(client); // Store the client in an array
    console.log(index)
    client.on("connect", () => {
        console.log(`Connected to client ${index + 1} (${config.host})`);
    });

    client.on("error", (err) => {
        console.error(`MQTT Connection Error for client ${index + 1}:`, err);
    });
});
 
                                                /******** CHANGED **********/ 
// Handle MQTT connection : connect to all availbale topics
clients[0].on('connect', () => {
    console.log('Connected to HiveMQ broker');
    for (const topic of topics){
        clients[0].subscribe(topic, { qos: 1 }, (err) => {
            if (!err) {
                console.log("Successfully subscribed to ",topic);
            } else {
                console.error("Subscription error:", err);
            }
        });

    }
    clients[0].subscribe('neoway', { qos: 1 }, (err) => {
        if (!err) {
            console.log("Successfully subscribed to neoway");
        } else {
            console.error("Subscription error:", err);
        }
    });


});
clients[1].on('connect', () => {
    console.log('Connected to HiveMQ broker');
    for (const topic of topics){
        clients[1].subscribe(topic, { qos: 1 }, (err) => {
            if (!err) {
                console.log("Successfully subscribed to ",topic);
            } else {
                console.error("Subscription error:", err);
            }
        });

    }
    clients[1].subscribe('neoway', { qos: 1 }, (err) => {
        if (!err) {
            console.log("Successfully subscribed to neoway");
        } else {
            console.error("Subscription error:", err);
        }
    });


});


/*********** CHANGED **************/ 
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

// Handle incoming MQTT messages
clients[0].on("message", (topic, message) => {
    if (topic === "neoway") {
        console.log(`Ignoring message from topic "${topic}"`);
        return;
    }

    try {
        //console.log(message.toString())
        const mess = maker(message.toString()); // Process the incoming message
        console.log(mess);
        messageQueue.push(mess); // Add message to the queue
        // console.log(selectedphase);
        //console.log(mess);
        // console.log(typeof mess.device);
        // console.log(typeof selectedphase);

        const phase = Number(selectedphase);
        const device_1 = Number(mess.device);
        if(email!=="k.gmail.com"){
            if (topic === selectedTopic) {
                if (phase === device_1) {
                    console.log("hey");
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(mess));
                        }
                    });
                }
            }
        }
    } catch (parseError) {
        console.error("Failed to parse message:", parseError);
    }
});
clients[1].on("message", (topic, message) => {
    console.log(message.toString());

    try {
        // Parse the message as JSON
        const data = JSON.parse(message.toString().trim());

        let parsedData = [];
        const phase = Number(selectedphase);

        // Iterate over the expected keys (v1, v2, v3, c1, c2, etc.)
        for (let i = 1; i <= 3; i++) {
            let vKey = `v${i}`;
            let cKey = `c${i}`;
            let pKey = `p${i}`;
            let eKey = `e${i}`;
            let fKey = `f${i}`;
            let pfKey = `pf${i}`;
            let alarmsKey = `alarms${i}`;

            let index = i;  // Device index (phase number)
            let vValue = data[vKey] !== undefined ? Math.abs(Number(data[vKey])) : 0.0;
            let cValue = data[cKey] !== undefined ? Math.abs(Number(data[cKey])) : 0.0;
            let pValue = data[pKey] !== undefined ? Math.abs(Number(data[pKey])) : 0.0;
            let eValue = data[eKey] !== undefined ? Math.abs(Number(data[eKey])) : 0.0;
            let fValue = data[fKey] !== undefined ? Math.abs(Number(data[fKey])) : 0.0;
            let pfValue = data[pfKey] !== undefined ? Math.abs(Number(data[pfKey])) : 0.0;
            let alarmsValue = data[alarmsKey] !== undefined ? Math.abs(Number(data[alarmsKey])) : 0;

            parsedData.push({
                "device": index,
                "voltage": vValue,
                "current": cValue,
                "power": pValue,
                "energy": eValue,
                "frequency": fValue,
                "powerFactor": pfValue,
                "alarms": alarmsValue
            });
        }

        

        // Find the device corresponding to the selected phase
        const filteredData = parsedData.find(item => item.device === phase);

        if (email === "k.gmail.com") {
            console.log(filteredData);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(filteredData));
                }
            });
        }
    } catch (error) {
        console.error("Error parsing JSON:", error);
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

app.post("/api/topic_name", async (req, res) => {
    const { topic, name,userEmail } = req.body;

    if (!topic || !name) {
        return res.status(400).json({ error: "Missing 'topic' or 'name' in the request body." });
    }

    console.log("Received Data:", { topic, name });
    
    // Respond back to the clients
    res.status(200).json({ message: "Data received successfully", topic, name,userEmail });
});

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


// API endpoint for incoming data
app.post('/api/data', async (req, res) => {
    if(email!=="k.gmail.com"){
        const device = req.body;
        const topic = 'neoway';
        const message = `${device.deviceId} ${device.status}`; // Format the message as "ac on" or "ac off"
        console.log({ topic, message });
    
        try {
            await clients.publish(topic, message, { qos: 0 }); // Send the formatted message
            console.log(`Message sent to topic "${topic}":`, message);
        } catch (err) {
            console.error('Error publishing message:', err);
            return res.status(500).json({ message: 'Error publishing message' });
        }
    
        res.json({ message: 'Data received successfully', receivedData: { topic, message } });
    }
    else{
        const device = req.body;
        const topic = 'neoway';
        const message = `${device.deviceId} ${device.status}`; // Format the message as "ac on" or "ac off"
        console.log({ topic, message });
    
        try {
            await clients.publish(topic, message, { qos: 0 }); // Send the formatted message
            console.log(`Message sent to topic "${topic}":`, message);
        } catch (err) {
            console.error('Error publishing message:', err);
            return res.status(500).json({ message: 'Error publishing message' });
        }
    
        res.json({ message: 'Data received successfully', receivedData: { topic, message } });
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
    email = req.cookies.email; // Extract email from cookies
    
    if (!email) {
        return res.status(401).json({ error: "No email found in cookies" });
    }
    
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
  })

  app.get('/time', (req, res) => {
    const serverTime = new Date().toISOString();
    res.json({ serverTime });
    });



// Start Express server
// app.listen(httpPort, () => {
//     console.log(`HTTP Server running on http://localhost:${httpPort}`);
// });

server.listen(httpPort, () => {
    console.log(`HTTP & WebSocket Server running on http://localhost:${httpPort}`);
});