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
  peel: Boolean,
});
var Game = mongoose.model("Game", GameSchema);

let validWords = makeWordList();

function makeWordList() {
  const fs = require('fs');
  const wordList = [];

  const data = fs.readFileSync("dictionary.txt",
               { encoding: 'utf8', flag: 'r' });

  let words = data.split('\n');
  for (let i in words) {
    let word = words[i];
    wordList.push(word);
  }
  return wordList;
}

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


// creates a new game if one doesn't exist - or adds the player to the current game
app.post("/joingame", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let user = req.body.user;

  let game = await Game.findOne({}).exec();
  if (game === null) {
    let newGame = new Game({
      tiles: ["A", "A", "A", "A", "A", "A", "A", "A", "A", "A", "A", "A",
              "A", "B", "B", "B", "C", "C", "C", "D", "D", "D", "D", "D",
              "D", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E",
              "E", "E", "E", "E", "E", "E", "E", "F", "F", "F", "G", "G",
              "G", "G", "H", "H", "H", "I", "I", "I", "I", "I", "I", "I",
              "I", "I", "I", "I", "I", "J", "J", "K", "K", "L", "L", "L",
              "L", "L", "M", "M", "M", "N", "N", "N", "N", "N", "N", "N",
              "N", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O",
              "P", "P", "P", "Q", "Q", "R", "R", "R", "R", "R", "R", "R",
              "R", "R", "S", "S", "S", "S", "S", "S", "T", "T", "T", "T",
              "T", "T", "T", "T", "T", "U", "U", "U", "U", "U", "U", "V",
              "V", "V", "W", "W", "W", "X", "X", "Y", "Y", "Y", "Z", "Z"]
      players: [user]
    });
    await newGame.save();
    res.end("Game created");
  }
  else {
    if (game.players.length == 4) {
      res.end("Game full");
    }
    else {
      await Game.updateOne({}, {$push: {players: user}});
      res.end("Player added");
    }
  }
});


// returns a random tile from the pool of available tiles and removes it from the pool
async function getTile() {
  let game = await Game.findOne({}).exec();
  let index = Math.floor(Math.random() * game.tiles.length);
  let letter = game.tiles[index];
  let newArr = game.tiles.splice(index, 1);
  await Game.updateOne({}, {tiles: newArr});
  return letter;
}

function checkValid(words) {
  for (i in words) {
    let word = words[i];
    if (!dict.includes(word)) {
      return false;
    }
  }
  return true;
}


// puts a peel into the queue 
app.post("/game/peel", async function (req, res) {
  let game = await Game.findOne({});
  if (!game.peel) {
    if (game.tiles.length < game.players.length) {
      let words = req.body.words;
      let user = req.body.user;
      let valid = checkValid(words);
      //if valid is true: this player wins
      //if valid is false: every other player wins
    }
    else {
      await Game.updateOne({}, {peel: true});
      setInterval(() => {Game.updateOne({}, {peel: false})}, 1000);
    }
  }
});


// called on eevry tick to update the game state
app.post("/game/ping", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let game = await Game.findOne({}).exec();
  if (game.peel) {
    let peel = await getTile();
    let tile = {tile: peel};
    res.status(200).send(JSON.stringify(tile, null, 4));
  }
});


// takes a tile to be dumped, returns a json object containing a list of three new letters
app.post("/game/dump", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let dump = req.body.tile;
  let game = await Game.findOne({}).exec();
  if (game.tiles.length  < 3) {
    res.status(400).send("DUMP: NOT ENOUGH TILES");
  }
  else if (game.peel) {
    res.status(400).send("DUMP: CANNOT DUMP RIGHT NOW");
  }
  else {
    let tile1 = await getTile();
    let tile2 = await getTile();
    let tile3 = await getTile();
    let newTiles = {tiles: [tile1, tile2, tile3]};
    await Game.updateOne({}, {$push: {tiles: dump}});
    res.status(200).send(JSON.stringify(newTiles, null, 4)); 
  }
});


// confirmation in terminal - app is up & listening
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
