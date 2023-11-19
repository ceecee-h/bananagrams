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
  password: String,
  salt: String,
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
are expired, if so, removes the user from the dictionary, effectively
revoking their authorization.
*/
function removeSessions() {
  let now = Date.now();
  let usernames = Object.keys(sessions);
  for (let i = 0; i < usernames.length; i++) {
    let last = sessions[usernames[i]].time;

    // remove every two minutes
    if (last + 120000 < now) {
      delete sessions[usernames[i]];
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

// get all listings by username
app.get("/store/get/listings/:username", function (req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");

  let p = User.find({ username: req.params.username }).exec();
  p.then((users) => {
    if (users == []) {
      res.send(JSON.stringify([], null, 4));
      return;
    }

    // assume unique usernames
    if (users.at(0).listings.length == 0) {
      console.log("No items for user");
      res.send(JSON.stringify([], null, 4));
      return;
    } else {
      items = Item.find({ _id: { $in: users.at(0).listings } }).exec();
      items
        .then((items) => {
          res.send(JSON.stringify(items, null, 4));
        })
        .catch((err) => {
          console.log(err);
          res.send("No items found");
        });
    }
  }).catch((err) => {
    console.log(err);
    res.send("User not found");
  });
});

//-- client post requests

// add a user record
app.post("/add/user/", (req, res) => {
  res.statusCode = 201;
  res.setHeader("Content-Type", "text/plain");

  let p1 = User.find({ username: req.body.user }).exec();
  p1.then((results) => {
    if (results.length == 0) {
      let u = new User({
        username: req.body.user,
        password: req.body.password,
        listings: [],
        purchases: [],
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

  let p = User.findOne({ username: username, password: password }).exec();
  p.then((user) => {
    if (!user) {
      res.status(404).send("User not found!");
      return;
    }
    let sid = addSession(user.username);
    res.cookie("login", { username: user.username, sessionID: sid }, { maxAge: 60000 * 2 });

    res.status(200).send(JSON.stringify(user, null, 4));
  }).catch((err) => {
    console.log(err);
    res.send("Error fetching users");
  });
});

// add an item record by username
app.post("/store/add/item/:username/", (req, res) => {
  res.statusCode = 201;
  res.setHeader("Content-Type", "text/plain");

  let title = req.body.title;
  let desc = req.body.description;
  let image = req.body.image;
  let price = req.body.price;
  let status = req.body.stat;
  let username = req.params.username;

  let newItem = new Item({
    title: title,
    description: desc,
    image: image,
    price: price,
    stat: status,
  });
  newItem.save();

  // conditional - update either listings or purchases
  if (newItem.stat == "SOLD") {
    User.updateOne(
      { username: username },
      {
        $push: { purchases: newItem.id },
      }
    ).exec();
  } else {
    User.updateOne(
      { username: username },
      {
        $push: { listings: newItem.id },
      }
    ).exec();
  }

  res.send("Item created");
});

// confirmation in terminal - app is up & listening
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
