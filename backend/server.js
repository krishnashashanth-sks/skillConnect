const express = require("express");
const app = express();
const cors = require('cors');
const connectDB = require("./Database/dbConnection.js");
require("dotenv").config();

const allowedOrigins=[
    process.env.FRONTEND_URL
]
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api",require("./authRoutes/authRoutes"));
app.use('/api/post',require("./postRoutes/route"));
app.use('/api/user',require("./userRoutes/userRoutes"));
app.use("/api",require("./wss/messagesRoute.js"))

app.listen(3000,"0.0.0.0",()=>{
    console.log("server is running on the port 3000");
});

