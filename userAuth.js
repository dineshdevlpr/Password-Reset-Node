const express = require('express')
const router = require("express").Router();
const { MongoClient, ObjectID } = require("mongodb");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
var randomstring = require("randomstring");
require("dotenv").config();

const dbUrl = process.env.DB_URL;
const feUrl = process.env.RESET_URL;
const randomStr = randomstring.generate();

router.post("/register", async (req, res) => {
    try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Password-Reset");
      let data = await db.collection("users").findOne({ email: req.body.email });
  
      if (!data) {
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
        await db.collection("users").insertOne(req.body);
        res.status(200).json({
          message: "User Successfully Registered",
        });
      } else {
        res.status(400).json({
          message: `User With ${req.body.email} Already Exists. Try Using Login Option`,
        });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  
    router.post("/login", async (req, res) => { 
    try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Password-Reset");
      let data = await db.collection("users").findOne({ email: req.body.email });
      if (data) {
        let isValid = await bcrypt.compare(req.body.password, data.password);
        if (isValid) {
          res.status(200).json({
            message: "Successfully Logged In",
          });
        } else {
          res.status(401).json({
            message: "Invalid Password",
          });
        }
      } else {
        res.status(400).json({
          message: `${req.body.email} not yet Registered`,
        });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  router.post("/forgot", async (req, res) => {
    try {
      let client = await MongoClient.connect(dbUrl);
      let db = client.db("Password-Reset");
      let data = await db
        .collection("users")
        .findOne({ email: req.body.email });
      if (data) {
  
        await db
          .collection("users")
          .findOneAndUpdate(
            { email: req.body.email },
            { $set: { randomString: randomStr } }
          );
        
  
        let mailTransporter = nodeMailer.createTransport({
          host: "smtp-mail.outlook.com",
          port: 587,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: "dineshdevlpr@outlook.com",
            pass: process.env.PASS
          }
        });
  
     
         let mailDetails = await mailTransporter.sendMail({
          from: '"DINESH"<dineshdevlpr@outlook.com>',
          to: req.body.email,
          subject: "Password Reset",
          html: `<div>
                    <h3>If You have requested for Password Reset, Click the following link to reset your password.If not requested, then just ignore this mail</h3>
                    <a href="${feUrl}${randomStr}">RESET PASSWORD</a>
                  </div>`,
        })   
        res.status(200).json({
          message:
            "Password Reset Link has been sent to your mail",
        });
      } else {
        res.status(404).json({
          message: "User not found",
        });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });
  
  router.post("/reset/:randomStr", async (req, res) => {
    try {
      const client = await MongoClient.connect(dbUrl, {
        useUnifiedTopology: true,
      });
      const db = client.db("Password-Reset");
      const userData = await db.collection("users").findOne({
        randomString: req.params.randomStr
      });
      if (userData) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const updated = await db
          .collection("users")
          .updateOne(
            { randomString: req.params.randomStr },
            { $set: { password: hashedPassword } }
          );
        if (updated) {
          await db
            .collection("users")
            .updateOne(
              { randomString: req.params.randomStr },
              { $unset: { randomString : 1} }
            );
  
          res.status(200).json({
            message: "Password Successfully updated",
          });
        }
      } else {
        res.status(404).json({
          message: "Error Password can't be updated",
        });
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  module.exports = router;