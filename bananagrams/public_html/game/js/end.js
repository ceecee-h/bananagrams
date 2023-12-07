/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: end.js
Date: 11/13/23

This is 'end.js', the client javascript file for the end game screen within 'Bananagrams'.
The HTML page 'end.html' utilizes this file.
It allows the client to find out who won or lost, friend other players, and return home.
It has 'GET' & 'POST' requests.
*/

var currentUser; // global user variable
var currentGame; // global game variable
setTimeout(getUser, 0);
setTimeout(getGame, 0);

/* 'getUser()':
Called automatically by the server on load.

Sends a 'GET' request to the server to get the currently logged in user.
Sets the global user variable to be used by other functions later.
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

Sends a 'GET' request to the server to get the game that was just played.
Sets the global game variable to be used by other functions later.
Has checking to make sure the 'currentUser' variable has been set,
and that the 'currentUser' was in the last game.
*/
function getGame() {
  if (currentUser == undefined) {
    setTimeout(getGame, 0); // 'getUser()' hasn't fetched yet - try again
  } else if (!currentUser.inGame) {
    // the logged in user wasn't in the game - clear the page and send them home
    let content = document.getElementsByTagName("body")[0];
    content.innerHTML = `<div class='return'><p>Hey! You're not supposed to be here!<p>
<button class='returnHome' onclick='returnHome()'>Return to Lobby</button></div>`;
  } else {
    game = fetch("getgame")
      .then((response) => {
        return response.text();
      })
      .then((game) => {
        currentGame = JSON.parse(game);
        setTitle();

        // get the game's players and, if they aren't the user, generate them on screen
        for (let user of currentGame.players) {
          if (user != currentUser.username) generatePlayer(user);
        }
      });
  }
}

/* 'returnHome()':
Activates on button click, moving the player back to the home page.
If they were in the game, make a call to 'destroygame' to make
sure all players have their '.inGame' field set to 'false' and
that the game model is destroyed.
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
Sets the title component of the end page using styled bananagram tiles.
The shown text depends on whether or not the user who called 'bananas' did so correctly.
If their board turned out to be connected and filled with valid words, it displays 'WINS'
Otherwise, it displays 'LOSES'.
These fields are found on the 'currentGame' global variable.
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
Builds the ui component for a bananagram tile, for stylistic purposes.
Returns the html needed to embed a tile.

letter - string, letter to be displayed on the tile
*/
function styledBananaTile(letter) {
  return `<div class="wrap"><div class="bananaTile"><b>${letter}</b></div></div>`;
}

/* 'generatePlayer()':
Builds the ui component (html) for a player entry in the lobby's players table.
Does a call for the logged in user's friendrequests and uses their 'friends'
field to determine their relationship with the logged-in user:
'Friend' button - user has not sent a friend request.
'Pending' text - user has sent a friend request, other player hasn't.
'Friends' text - user is friends with the player.

username - string, username of a player
*/
function generatePlayer(username) {
  table = fetch(`${currentUser.username}/friendrequest`)
    .then((response) => {
      return response.text();
    })
    .then((requests) => {
      let friendRequests = requests;

      let playerTable = document.getElementById("players");
      let row = `<tr><td>${username}</td>`;

      // determine HTML needed for the 'Friend?' column
      if (!currentUser.friends.includes(username) && !friendRequests.includes(username)) {
        row += `<td><button id=${username} class="friendRequest" 
onclick='sendFriendRequest(this.id)'>Friend</button></td></tr>`;
      } else if (friendRequests.includes(username)) {
        row += `<td><i>Request Pending</i></td></tr>`;
      } else {
        row += `<td><strong>Friends</strong></td></tr>`;
      }

      playerTable.innerHTML += row;
    });
}

/* 'sendFriendRequest()':
Sends a 'post' request when the user sends a friend request.
Resets the 'playerTable' html to update the 'Friend?' column from the friend button to:
'Pending' text - user has sent a friend request, other player hasn't.
'Friends' text - user is friends with the player.

username - string, username of a player, set by 'this.id' in 'generatePlayer()'.
*/
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
    getUser(); // in case the other player already sent a friend request

    // get the game's players and, if they aren't the user, generate them on screen
    for (let user of currentGame.players) {
      if (user != currentUser.username) generatePlayer(user);
    }
  });
}
