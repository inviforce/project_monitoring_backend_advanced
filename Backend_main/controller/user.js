const path = require("path");
const User = require("../models/user");
const {v4 : uuidv4} = require('uuid')
const {setUser} = require("../service/auth")

async function handleUserSignup(req,res) {

    try {
    
    const { name, email, password } = req.body;
    const newUser = await User.create({
        name,
        email,
        password,
    });

    console.log("User signup successful!")
    console.log("Saved user data:", newUser);
  
    return res.redirect("/");
    
}  catch (error) {
    console.error("Error during user signup:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
    
}


async function handleUserLogin(req,res) {

   
    
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });


    if(!user) return res.render("index" , {
        error : "Invalid email or password"
    });

    const sessionId = uuidv4();
    setUser(sessionId , user);
    res.cookie('uid' , sessionId);
    return res.redirect("/");
    
}

module.exports = {
    handleUserSignup,
    handleUserLogin,
};