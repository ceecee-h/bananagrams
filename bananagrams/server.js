/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: server.js
Date: 11/13/23

-- STILL OOSTA, EDIT WHEN PAGE IS DONE --
This is 'server.js', a javascript file working with
'mongoose', 'node', 'express', and 'body-parser'.
It's a server for our final project, Bananagrams, a web application version of the board game.
It uses a database to store / load users and items.

It sets up the database and has functions defining how to react when a client
submits a certain type of request:
  - get -> called with url '/get/argument'
           gathers the required info and returns a json containing the info to the client
  - post -> called when the client creates a user or item
            creates a new schema object and saves it to the database.
*/

// -- requirements
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const express = require("express");
const parser = require("body-parser");
const crypto = require("crypto");
const app = express();
const port = 3000;

// -- DB stuff
const db = mongoose.connection;
const mongoDBURL = "mongodb://127.0.0.1/bananagrams";
mongoose.connect(mongoDBURL, { useNewUrlParser: true });
db.on("error", () => {
  console.log("MongoDB connection error:");
});

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  password: String, // hash(password + salt)
  salt: String,
  inGame: Boolean,
  wins: Number,
  played: Number,
  friends: Array, // list of object ids
});
var User = mongoose.model("User", UserSchema);

var FriendRequestSchema = new Schema({
  from: Object,
  to: Object,
});
var FriendRequest = mongoose.model("FriendRequest", FriendRequestSchema);

var GameSchema = new Schema({
  tiles: Array,
  players: Array,
});
var Game = mongoose.model("Game", GameSchema);

app.use(parser.json());
app.use(cookieParser());

// session info
let sessions = {};
let timeout = 1800000;

/* 'addSession()':
Called upon a user login and adds a user sessionId to the session
dictionary.
*/
function addSession(username) {
  let sid = Math.floor(Math.random() * 1000000000);
  let now = Date.now();
  sessions[username] = { id: sid, time: now };
  return sid;
}

/* 'removeSessions()':
Checks if the current sessions stored in the session dictionary
are expired.
If a session has expired, find the user and see if they're currently playing.
If they're playing, reset the timer. If they aren't, remove the user from the
dictionary, effectively revoking their authorization.
*/
function removeSessions() {
  let now = Date.now();
  let usernames = Object.keys(sessions);
  for (let i = 0; i < usernames.length; i++) {
    let last = sessions[usernames[i]].time;

    // the allotted time has expired
    if (last + timeout < now) {
      let username = usernames[i];
      let p = User.findOne({ username: username }).exec();
      p.then((user) => {
        if (!user.inGame) {
          delete sessions[usernames[i]];
        } else {
          sessions[usernames[i]].time = Date.now() + timeout; // give the user more time - they're in-game!
        }
      });
    }
  }
  console.log(sessions);
}

// check for session status every 2 seconds
setInterval(removeSessions, 2000);

/* 'authenticate()':
Redirects a user to the login page if they are not
currently in an authenticated session. Uses the
'req' parameter to get the current cookies and
'res' to redirect the user (if needed).
*/
function authenticate(req, res, next) {
  let c = req.cookies;
  console.log("auth request:");
  console.log(req.cookies);
  if (c != undefined && c.login != undefined) {
    if (
      sessions[c.login.username] != undefined &&
      sessions[c.login.username].id == c.login.sessionID
    ) {
      next();
    } else {
      res.redirect("/index.html");
    }
  } else {
    res.redirect("/index.html");
  }
}

app.use("/game/", authenticate);
app.get("/game/", (req, res, next) => {
  console.log("another");
  next();
});
app.use(express.static("public_html")); // static

//-- client get requests

// get the current user
app.get("/store/get/currentuser/", function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let c = req.cookies;

  if (c != undefined && c.login != undefined) {
    let username = c.login.username;
    if (username != undefined) {
      let p = User.findOne({ username: username }).exec();
      p.then((user) => {
        res.status(200).send(JSON.stringify(user, null, 4));
      }).catch((err) => {
        console.log(err);
        res.send("Error fetching users");
      });
    }
  }
});

//-- client post requests

/* 'generateSalt()':
Called by '/add/user'.

Creates a random salt for user creation.
The salt is between 10 and 15 characters in length to create some
extra variance. A for loop is used to increment that many times,
every round generating a random character that could be a special
character (i.e. '-', '<', etc.), alphabetical, or numerical.
*/
function generateSalt() {
  let max = Math.floor(Math.random() * 5 + 10); // 10 - 15
  let salt = "";
  for (let i = 0; i < max; i++) {
    let number = Math.floor(Math.random() * 93 + 33); // 33 - 126 (valid ascii chars)
    let char = String.fromCharCode(number); // '!' to '~' of ascii table
    salt += char;
  }

  return salt;
}

/* 'generateHash()':
Called by '/add/user' and '/login'.

password: the user's inputted password
salt: the salt generated by 'generateSalt()', either just now or from the user object
The password and salt are concatenated together into 'toHash' and then,
using the crypto module, a new hash is made, 'toHash' is put in, and it's encrypted.
*/
function generateHash(password, salt) {
  let toHash = password + salt;
  let hashed = crypto.createHash("sha256").update(toHash).digest("hex");

  return hashed;
}

// add a user record
app.post("/add/user/", (req, res) => {
  res.statusCode = 201;
  res.setHeader("Content-Type", "text/plain");

  let password = req.body.password;
  let salt = generateSalt();
  let hashed = generateHash(password, salt);

  let p1 = User.find({ username: req.body.user }).exec();
  p1.then((results) => {
    if (results.length == 0) {
      let u = new User({
        username: req.body.user,
        password: hashed,
        salt: salt,
        inGame: false,
        wins: 0,
        played: 0,
        friends: [],
      });
      let p = u.save();
      p.then(() => {
        res.send("USER CREATED");
      });
      p.catch(() => {
        res.send("DATABASE SAVE ISSUE");
      });
    } else {
      res.send("USERNAME ALREADY TAKEN");
    }
  });
});

// user logging in - give the user a cookie upon login (post due to sensitive information)
app.post("/login", function (req, res) {
  res.setHeader("Content-Type", "text/plain");

  let username = req.body.user;
  let password = req.body.password;

  let p = User.findOne({ username: username }).exec();
  p.then((user) => {
    if (!user) {
      res.status(404).send("User not found!");
      return;
    }

    let salt = user.salt;
    let hashed = generateHash(password, salt);
    if (hashed == user.password) {
      let sid = addSession(user.username);
      res.cookie("login", { username: user.username, sessionID: sid }, { maxAge: 60000 * 2 });

      res.status(200).send(JSON.stringify(user, null, 4));
    } else {
      res.status(400).send("Incorrect password!");
      return;
    }
  }).catch((err) => {
    console.log(err);
    res.send("Error fetching users");
  });
});

// confirmation in terminal - app is up & listening
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
