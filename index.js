const mqtt = require('mqtt');
const url = require('url');
const express = require('express');
const port = 8000;
const mongoose = require('mongoose')
const shortID = require('shortid');
const http = require('http');
const moment = require('moment');
const { stringify } = require('querystring');

const app = express();

const dataSchema = new mongoose.Schema({
    _id : {
        type : String,
        required : true,
    },
    device_id : {
        type : String,
        required : true,
    },
    Type : {
        type : String,
        required : true,
    },
    value : {
        type : Number,
        required : true,
    },
    created : {
        type : Date ,
        default : moment().utc().add(5,'hours'),
    },
} , {
    _id : false,
    id : false,
    versionKey : false,
    strict : false
})

const data = mongoose.model("user" , dataSchema);

mongoose.connection.on('connected' , ()=>{
    console.log('MongoDB connected');
})

mongoose.connection.on('error' , (err) => {
    console.log('Error connecting MongoDb',err);
})


app.get("/" , (req,res)=> {
    return res.send("hello fromt the home page");
})

const client = mqtt.connect({
    host: 'e800a45536b84764b7075bdc33165c5a.s1.eu.hivemq.cloud',
    port: 8883, // Secure port
    username: 'hellomqtt',
    password: 'Hello@123',
    protocol: 'mqtts' // Secure connection
});

const topic = "topic1";

client.on('connect',() => {
    console.log('MQTT Connected');
    client.subscribe('current',(err)=>{
        if(!err){
            console.log("no error");
        }
    });
    client.subscribe(topic);
})

client.on('connect',() => {
    console.log('MQTT Connected');
    client.subscribe('current',(err)=>{
        if(!err){
            console.log("no error");
        }
    });
    client.subscribe("topic2");
})

client.on('connect', () => {
    client.publish("topicr", 'nodejs mqtt test',(error) => {
      if (error) {
        console.error(error)
      }
    })
  })
  

client.on("message",async (topic,message)=>{
    console.log(`${topic} : ${message}`)

    let data = message.toString();
    data = JSON.parse(data);
    data._id = shortID.generate();

    await saveData(data);
})

saveData = async(data) => {
    data = new Events(data);
    data = await data.save();
    console.log('Saved Data:' , data);
}
    

app.listen(port , ()=>  {

    mongoose.connect('mongodb+srv://hemlatasharmasatish:2023uce0064@cluster0.lm16n.mongodb.net/Practice?retryWrites=true&w=majority&appName=Cluster0')
    console.log(`Server is connected on PORT ${port}`);
})