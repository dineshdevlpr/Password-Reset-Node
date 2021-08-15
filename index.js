const express = require('express')
const cors = require("cors");
const router = require("./userAuth");
const { MongoClient, ObjectID } = require("mongodb");
require("dotenv").config();

const app = express()

const port = process.env.PORT || 4000;
const dbUrl = process.env.DB_URL;

app.use(express.json())
app.use(cors());

app.use('/' , router)

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`)
})
