/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: home.js
Date: 11/13/23

This is 'home.js', the client javascript file for the home screen within 'Bananagrams'.
The HTML page 'home.html' utilizes this file.
It allows the client to join a lobby and start a game, and look at their stats,
including their games played, wins, win rate, and their friends.
*/

var currentUser; // global user variable
setTimeout(getUser, 0);

window.onload = () => {
  generateLobby();
};
setInterval(generateLobby, 1000); // see if there's a game & if you're apart of it

/* 'getUser()':
Called automatically by the server on load.

Sends a 'GET' request to the server to get the currently logged in user.
Sets the global user variable and sets the 'welcome' message to be
personalized for that user.
*/
function getUser() {
  user = fetch("getuser")
    .then((response) => {
      return response.text();
    })
    .then((user) => {
      currentUser = JSON.parse(user);
      setTitle();
      generateStats();
      getFriendList();
    });
}

/* 'getFriendList()':
Called automatically by the server on load.

Sends a 'GET' request to the server to get the currently logged in user's friend objects.
Loops through them to ensure their correct win rate is shown - "N/A" if they've never played.
*/
function getFriendList() {
  let friendlist = fetch(`friends/${currentUser.username}`)
    .then((response) => {
      return response.text();
    })
    .then((friendlist) => {
      let friends = JSON.parse(friendlist);
      for (let i = 0; i < currentUser.friends.length; i++) {
        if (friends[i].wins == 0 && friends[i].played == 0) {
          generateFriend(friends[i].username, "N/A");
        } else {
          generateFriend(friends[i].username, `${friends[i].wins}%`);
        }
      }
    });
}

// SERVER COMMUNICATION
/* 'joinGame()':
Posts a player to the server to join the current game waiting
in the lobby, or creates one otherwise.
*/
function joinGame() {
  let p = fetch("joingame", {
    method: "POST",
    body: JSON.stringify({ user: currentUser.username }),
    headers: { "Content-Type": "application/json" },
  });

  p.then((response) => {
    return response.status;
  })
    .then((status) => {
      generateLobby();
    })
    .catch((error) => {
      console.log("THERE WAS A PROBLEM");
      console.log(error);
    });
}

/* 'generateLobby()':
Generate the lobby visuals
cases:
    - open: join game button available
    - waiting
        - if host: add start button
        - else: current number of players waiting
    - active: display game in progress
*/
function generateLobby() {
  let lobby = document.getElementById("lobby");
  game = fetch("pinglobby")
    .then((response) => {
      return response.text();
    })
    .then((game) => {
      if (game == "") {
        // no game in progress
        lobby.innerHTML = '<button class="join" onclick="joinGame()">JOIN GAME</button>';
      } else {
        currentGame = JSON.parse(game);
        // game started!!
        if (currentGame.inProgress && currentGame.players.includes(currentUser.username)) {
          window.location.replace(`${window.location.origin}/game/game.html`);
        }
        // game present
        if (currentGame.inProgress) {
          // game in progress, cannot join
          lobby.innerHTML = '<div id="active">GAME IN PROGRESS...</div>';
        } else if (currentGame.players[0] == currentUser.username) {
          // user is host of lobby
          lobby.innerHTML = `<div class="waiting"><p>waiting for players...</p><p>`;
          lobby.innerHTML += `${currentGame.players.length}/4</p><button class="join"`;
          lobby.innerHTML += ` onclick="startGame()">START GAME</button></div>`;
        } else if (currentGame.players.includes(currentUser.username)) {
          // user in lobby
          lobby.innerHTML = `<div class="waiting"><p>waiting for players...</p><p>`;
          lobby.innerHTML += `${currentGame.players.length}/4</p></div>`;
        } else {
          // lobby is open to join
          lobby.innerHTML = '<button class="join" onclick="joinGame()">JOIN GAME</button>';
        }
      }
    });
}

/* 'startGame()':
Trigger the start of a game, moving all players in the
waiting lobby to the game screen
*/
function startGame() {
  let p = fetch("startgame", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
  });

  p.then((response) => {
    return response.status;
  })
    .then((status) => {
      generateLobby();
    })
    .catch((error) => {
      console.log("THERE WAS A PROBLEM");
      console.log(error);
    });
}

// UI GENERATION

/* 'setTitle()':
Sets the title component of the home page using
styled bananagram tiles

*/
function setTitle() {
  let title = document.getElementById("welcomeUser");
  let userText = currentUser.username.toUpperCase();
  let welcome = "WELCOME";
  let titleHTML = '<div class="row">';
  for (let i = 0; i < welcome.length; i++) {
    titleHTML += styledBananaTile(welcome[i]);
  }
  titleHTML += '</div><div class="row">';
  for (let i = 0; i < userText.length; i++) {
    titleHTML += styledBananaTile(userText[i]);
  }
  titleHTML += "</div>";
  title.innerHTML = titleHTML;
}

/* 'styledBananaTile()':
Builds the ui component for a bananagram tile, for stylistic
purposes only on the home page.

letter - the letter to be turned into a tile

returns - the HTML code representing a tile
*/
function styledBananaTile(letter) {
  return `<div class="wrap"><div class="bananaTile"><b>${letter}</b></div></div>`;
}

/* 'generateFriend()':
Builds the ui component for a friend entry in the friend list table

username - the friend's username
winRate - the win rate of the friend
*/
function generateFriend(username, winRate) {
  let friendTable = document.getElementById("friends");
  friendTable.innerHTML += `<tr><td>${username}</td><td>${winRate}</td></tr>`;
}

/* 'generateStats()':
Calculates the user statistics based off the given wins and total games
played for a user and sets those values into the ui table component
*/
function generateStats() {
  let wins = currentUser.wins;
  let total = currentUser.played;

  let win_count = document.getElementById("win_count");
  let lose_count = document.getElementById("lose_count");
  let total_games = document.getElementById("total_games");
  let win_rate = document.getElementById("win_rate");

  win_count.innerText = wins;
  lose_count.innerText = total - wins;
  total_games.innerText = total;

  if (wins == 0 && total == 0) {
    win_rate.innerText = "N/A";
  } else {
    win_rate.innerText = `${(wins / total) * 100}%`;
  }
}

/* 'logoutUser()':
Called by clicking the 'login' button on 'index.html'

Used to send a 'GET' request to the server to get a user.
Gathers inputs, checks them, and uses them to create the url.
'GET' request is then sent to the server, the respose's status code is checked.
Status code dictates whether or not the user will be redirected.
*/
function logoutUser() {
  let package = { user: currentUser.username };

  let p = fetch("/logout", {
    method: "POST",
    body: JSON.stringify(package),
    headers: { "Content-Type": "application/json" },
  });

  p;
  window.location.replace(`${window.location.origin}/index.html`);
}
