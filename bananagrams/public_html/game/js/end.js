/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: index.js
Date: 11/13/23

-- STILL OOSTA, EDIT WHEN PAGE IS DONE --
This is 'index.js', the client javascript file for account handling within 'Bananagrams'.
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
  if (currentUser == undefined) {
    setTimeout(getGame, 0);
  } else if (!currentUser.inGame) {
    let content = document.getElementsByTagName("body")[0];
    content.innerHTML =
      "<div class='return'><p>Hey! You're not supposed to be here!<p><button class='returnHome' onclick='returnHome()'>Return to Lobby</button></div>";
  } else {
    game = fetch("getgame")
      .then((response) => {
        return response.text();
      })
      .then((game) => {
        currentGame = JSON.parse(game);
        setTitle();
        for (let user of currentGame.players) {
          if (user != currentUser.username) generatePlayer(user);
        }
      });
  }
}

/* 'returnHome()':
Activates on button click, moving the player back to the
home page.
*/
function returnHome() {
  if (!currentUser.inGame) window.location.replace(`${window.location.origin}/game/home.html`);
  else {
    game = fetch("destroygame").then(() => {
      window.location.replace(`${window.location.origin}/game/home.html`);
    });
  }
}

/* 'setTitle()':
Sets the title component of the home page using
styled bananagram tiles
game: game object, has the winner or loser of the game
*/
function setTitle() {
  let title = document.getElementById("outcome");
  let userText = currentGame.user.toUpperCase();

  let status;
  if (currentGame.win) status = "WINS";
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
  return `<div class="wrap"><div class="bananaTile"><b>${letter}</b></div></div>`;
}

/* 'generatePlayer()':
Builds the ui component for a friend entry in the friend list table

Takes the friend's username and win rate
*/
function generatePlayer(username) {
  console.log(currentUser.username);
  table = fetch(`${currentUser.username}/friendrequest`)
    .then((response) => {
      return response.text();
    })
    .then((requests) => {
      let friendRequests = requests;

      let playerTable = document.getElementById("players");
      let row = `<tr><td>${username}</td>`;

      if (!currentUser.friends.includes(username) && !friendRequests.includes(username)) {
        row += `<td><button id=${username} class="friendRequest" onclick='sendFriendRequest(this.id)'>Friend</button></td></tr>`;
      } else if (friendRequests.includes(username)) {
        row += `<td><i>Request Pending</i></td></tr>`;
      } else {
        row += `<td><strong>Friends</strong></td></tr>`;
      }

      playerTable.innerHTML += row;
    });
}

function sendFriendRequest(username) {
  let package = {
    to: username,
    from: currentUser.username,
  };

  let p = fetch("/game/friendrequest", {
    method: "POST",
    body: JSON.stringify(package),
    headers: { "Content-Type": "application/json" },
  });

  p.then((response) => {
    let playerTable = document.getElementById("players");
    playerTable.innerHTML =
      "<tr><th colspan='2'>Game Players</th></tr><tr><th>Username</th><th>Friend?</th></tr>";
    getUser();
    for (let user of currentGame.players) {
      if (user != currentUser.username) generatePlayer(user);
    }
  });
}
