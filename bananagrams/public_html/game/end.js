/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: login.js
Date: 11/13/23

-- STILL OOSTA, EDIT WHEN PAGE IS DONE --
This is 'login.js', the client javascript file for account handling within 'Bananagrams'.
The HTML page 'index.html' utilizes this file.
It allows the client to create/submit their own users & items.
It fulfills the 'POST' HTTP requests with 'createUser()' and 'createItem()'.
*/

var currentUser; // global user variable
var currentGame;
setTimeout(getUser, 0);
setTimeout(getGame, 0);

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
    });
}

/* 'getGame()':
Called automatically by the server on load.

Sends a 'GET' request to the server to get the currently logged in user.
Sets the global user variable and sets the 'welcome' message to be
personalized for that user.
*/
function getGame() {
  user = fetch("getgame")
    .then((response) => {
      return response.text();
    })
    .then((game) => {
      currentGame = JSON.parse(game);
      setTitle(game);
    });
}

/* 'returnLobby()':
Activates on button click, moving the player back to the
home page.
*/
function returnLobby() {
  window.location.replace(`${window.location.origin}/game/home.html`);
}

/* 'setTitle()':
Sets the title component of the home page using
styled bananagram tiles
game: game object, has the winner or loser of the game
*/
function setTitle(outcome) {
  let title = document.getElementById("outcome");
  let userText = outcome.user.toUpperCase();

  let status;
  if (outcome.win) status = "WINS";
  else status = "LOSES";

  let titleHTML = '<div class="row">';
  for (let i = 0; i < userText.length; i++) {
    titleHTML += styledBananaTile(userText[i]);
  }
  titleHTML += '</div><div class="row">';
  for (let i = 0; i < status.length; i++) {
    titleHTML += styledBananaTile(status[i]);
  }
  titleHTML += "</div>";
  title.innerHTML = titleHTML;
}

/* 'styledBananaTile()':
Builds the ui component for a bananagram tile, for stylistic
purposes only on the home page.

Takes a letter and returns the html needed to embed a tile.
*/
function styledBananaTile(letter) {
  return `<div class="wrap"><div class="banana_tile"><b>${letter}</b></div></div>`;
}

/* 'generateFriend()':
Builds the ui component for a friend entry in the friend list table

Takes the friend's username and win rate
*/
function generateFriend(username, win_rate) {
  let friendTable = document.getElementById("friends");
  friendTable.innerHTML += `<tr><td>${username}</td><td>${win_rate}%</td></tr>`;
}
