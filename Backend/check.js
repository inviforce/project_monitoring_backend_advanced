const { MongoClient } = require('mongodb');
const express = require("express");
const app = express();
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Allow these origins
    methods: ['GET', 'POST'], // Specify allowed methods
    credentials: true // Enable cookies for cross-origin requests (if needed)
}));

// Function to fetch documents within a time range
async function getDocumentsWithinTimeRange(dbUrl, dbName, collectionName, startTime, endTime) {
    const client = new MongoClient(dbUrl);

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const query = {
            $and: [
                { createdAt: { $gte: new Date(startTime) } }, // Start time >= input start time
                { createdAt: { $lte: new Date(endTime) } }    // End time <= input end time
            ]
        };

        // Fetch documents based on query
        const documents = await collection.find(query).toArray();

        return documents;
    } catch (error) {
        console.error("Error retrieving documents:", error);
        throw error;
    } finally {
        // Ensure client is closed
        await client.close();
    }
}

const dbUrl = 'mongodb://localhost:27017';  
const dbName = 'prj';                       
const collectionName = 'users';             

app.get("/datee", (req, res) => {
    // Extract startTime and endTime from query parameters
    const { startTime, endTime } = req.query;

    // Check if both startTime and endTime are provided
    if (!startTime || !endTime) {
        return res.status(400).json({ error: "Both startTime and endTime must be provided" });
    }

    // Call the function with dynamic startTime and endTime
    getDocumentsWithinTimeRange(dbUrl, dbName, collectionName, startTime, endTime)
        .then(docs => {
            // Extract values into separate arrays
            const voltageArray = docs.map(doc => doc.voltage);
            const currentArray = docs.map(doc => doc.current);
            const energyArray = docs.map(doc => doc.energy);
            const powerFactorArray = docs.map(doc => doc.power_f);
            const timeArray = docs.map(doc => doc.createdAt);

            console.log('Voltage Array:', voltageArray);
            console.log('Current Array:', currentArray);
            console.log('Energy Array:', energyArray);
            console.log('Power Factor Array:', powerFactorArray);

            return res.status(200).json({
                voltage: voltageArray,
                current: currentArray,
                energy: energyArray,
                powerFactor: powerFactorArray,
                time: timeArray
            });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

app.listen(5500, () => {
    console.log("Listening for requests");
});

