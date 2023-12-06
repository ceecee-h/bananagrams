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

// -- requirements & express set-up
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const express = require("express");
const parser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");

const port = 3000;
const app = express();

app.use(parser.json());
app.use(cookieParser());

app.use("/game/", authenticate);
app.get("/game/", (req, res, next) => {
  console.log("another");
  next();
});
app.use(express.static("public_html")); // static

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
  tiles: Array,
  wins: Number,
  played: Number,
  friends: Array, // list of object ids
});
var User = mongoose.model("User", UserSchema);

var FriendRequestSchema = new Schema({
  from: String,
  to: String,
});
var FriendRequest = mongoose.model("FriendRequest", FriendRequestSchema);

var GameSchema = new Schema({
  tiles: Array,
  players: Array,
  peel: Boolean,
  win: Boolean,
  user: String,
  inProgress: Boolean,
});
var Game = mongoose.model("Game", GameSchema);

// -- sessions / logging in / account creation

// session info
let sessions = {};
let timeout = 1800000; // thirty minutes in milliseconds

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

/* 'generateSalt()':
Called by '/create'.

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
Called by '/create' and '/login'.

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
app.post("/create", (req, res) => {
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

      // create the user's cookie - keep it for up to two hours
      res.cookie("login", { username: user.username, sessionID: sid }, { maxAge: 60000 * 120 });

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

// -- game requests

// get the current user
app.get("/game/getuser", function (req, res) {
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

// get friends content
app.get("/game/friends/:user", function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let username = req.params.user;
  let p = User.findOne({ username: username }).exec();
  p.then((user) => {
    let friends = User.find({username: {$in: user.friends}}).exec();
      friends.then((friendlist) => {
        res.status(200).send(JSON.stringify(friendlist, null, 4));
      })
  }).catch((err) => {
    console.log(err);
    res.send("Error fetching users");
  });
});

// get the current game
app.get("/game/getgame", function (req, res) {
  res.setHeader("Content-Type", "text/plain");

  let game = Game.findOne({})
    .exec()
    .then((game) => {
      if (game == undefined) res.status(404).send("INVALID");
      else {
        res.status(200).send(JSON.stringify(game, null, 4));
      }
    });
});

// ping current game status
app.get("/game/pinglobby", function (req, res) {
  res.setHeader("Content-Type", "text/plain");

  let game = Game.findOne({})
    .exec()
    .then((game) => {
      if (game == undefined) res.status(204).send("No game in progress");
      else {
        res.status(200).send(JSON.stringify(game, null, 4));
      }
    });
});

// creates a new game if one doesn't exist - or adds the player to the current game
app.post("/game/joingame", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let user = req.body.user;
  console.log(user);
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
              "V", "V", "W", "W", "W", "X", "X", "Y", "Y", "Y", "Z", "Z"],
      players: [user],
    });
    await newGame.save();
    res.end("Game created");
  } else {
    if (game.players.length == 4) {
      res.end("Game full");
    } else {
      await Game.updateOne({}, { $push: { players: user } });
      res.end("Player added");
    }
  }
});

app.post("/game/startgame", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let game = await Game.findOne({}).exec();
  if (game === null) {
    res.status(405).send("How did you do this");
  } else {
    // game in progress
    await Game.updateOne({}, { inProgress: true });
    let players = game.players;
    for (let player of players) {
      let playerTiles = [];
      for (let i = 0; i < 21; i++) {
        playerTiles.push(getTile());
      }
      await User.updateOne({ username: player }, { inGame: true }, {tiles: playerTiles}).exec();
    }
    res.end("Game started");
  }
});

app.get("/game/destroygame", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let game = await Game.findOne({}).exec();
  if (game === null) {
    res.end("Game already deleted");
  } else {
    let players = game.players;
    for (let player of players) {
      await User.updateOne({ username: player }, { inGame: false }, {tiles: []}).exec();
    }
    await Game.deleteOne({}).exec();
    res.end("Game deleted");
  }
});

// returns a random tile from the pool of available tiles and removes it from the pool
async function getTile() {
  let game = await Game.findOne({}).exec();
  let index = Math.floor(Math.random() * game.tiles.length);
  let letter = game.tiles[index];
  let newArr = game.tiles.splice(index, 1);
  await Game.updateOne({}, { tiles: newArr });
  return letter;
}

let validWords = () => {
  const wordList = [];

  const data = fs.readFileSync("/public_html/game/dictionary.txt", { encoding: "utf8", flag: "r" });

  let words = data.split("\n");
  for (let i in words) {
    let word = words[i];
    wordList.push(word);
  }
  return wordList;
};

function checkValid(words) {
  for (i in words) {
    let word = words[i];
    if (!validWords.includes(word)) {
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
      await Game.updateOne({}, { win: valid });
      await Game.updateOne({}, { user: user});
      let players = game.players;
      for (i in players) {
        let player = players[i];
        await User.updateOne({ username: player }, {$inc: { played: 1 }});
        if ((player == user && valid) || (player != user && !valid)) {
          await User.updateOne({ username: player }, {$inc: { wins: 1 }});
        }
      }
    }
    } else {
      await Game.updateOne({}, { peel: true });
      setInterval(() => {
        Game.updateOne({}, { peel: false });
      }, 1000);
    }
  }
);

// called on every tick to update the game state
app.post("/game/ping/:user", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let user = req.params.user;
  let game = await Game.findOne({}).exec();
  if (game.peel) {
    let peel = await getTile();
    let tile = { tile: peel };
    await User.updateOne({username: user}, {tiles: {$push: peel}});
    res.status(200).send(JSON.stringify(tile, null, 4));
  }
});

// takes a tile to be dumped, returns a json object containing a list of three new letters
app.post("/game/dump/:user", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let user = req.params.user;
  let dump = req.body.tile;
  let game = await Game.findOne({}).exec();
  if (game.tiles.length < 3) {
    res.status(400).send("DUMP ERROR: NOT ENOUGH TILES");
  } else if (game.peel) {
    res.status(400).send("DUMP ERROR: PEEL HAPPENING");
  } else {
    let tile1 = await getTile();
    let tile2 = await getTile();
    let tile3 = await getTile();
    let newTiles = { tiles: [tile1, tile2, tile3] };
    await Game.updateOne({}, { $push: { tiles: dump } });
    await User.updateOne({username: user}, {tiles: {$push: [tile1, tile2, tile3]}});
    res.status(200).send(JSON.stringify(newTiles, null, 4));
  }
});

// send a friend request from one user to another
app.post("/game/friendrequest", async function (req, res) {
  res.setHeader("Content-Type", "text/plain");
  let from = req.body.from;
  let to = req.body.to;
  let request = await FriendRequest.findOne({ from: to, to: from }).exec();
  if (request === null) {
    let newRequest = new FriendRequest({ from: from, to: to });
    await newRequest.save();
    res.status(200).send("Request Pending");
  } else {
    await User.updateOne({ username: from }, { $push: { friends: to } });
    await User.updateOne({ username: to }, { $push: { friends: from } });
    await FriendRequest.deleteOne({ from: from, to: to });
    res.status(200).send("Friend Added");
  }
});

// get list of users who the given user has an outgoing friend request to
app.get("/game/:user/friendrequest", async function (req, res) {
  let requests = await FriendRequest.find({ from: req.params.user }).exec();
  let users = await requests.map((request) => request.to);
  res.status(200).send(users);
});

// confirmation in terminal - app is up & listening
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
