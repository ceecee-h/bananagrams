/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: game.js
Date: 11/13/23

This is 'game.js', the client javascript file for running the gameplay within 'Bananagrams'.
The HTML page 'game.html' utilizes this file.
It allows the client to get new tiles when peels/dumps are made.
It fulfills 'GET' HTTP requests with 'getUser()' and 'ping()'.
It fulfills 'POST' HTTP requests with 'peelBanana()' and 'dumpTile()'.
*/

var currentUser;
var currentGame;

var currentTiles = [];
var selectedTileId = "";
var count = 0;
var words = [];

setTimeout(getUser, 0);
setTimeout(getGame, 0);
var currentTiles = [];
var selectedTileId = "";
var count = 0;
var words = [];
var bananas = false;
let userBoard = new Array(21);

setTimeout(getUser, 0);
setTimeout(checkUser, 0);
setInterval(ping, 1000);

window.onload = () => {
  generateGrid();
};

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
      addToPool(currentUser.tiles);
    });
}

/* 'getGame()':
Called automatically by the server on load.

Sends a 'GET' request to the server to get the current game.
Sets the global game variable to be used by other functions later.
Has checking to make sure the 'currentUser' variable has been set.


*/
function getGame() {
  if (currentUser == undefined) {
    setTimeout(getGame, 0); // 'getUser()' hasn't fetched yet - try again
  } else {
    game = fetch("getgame")
      .then((response) => {
        return response.text();
      })
      .then((game) => {
        currentGame = JSON.parse(game);
      });
  }
}

/* 'checkUser()':
Called automatically by the server on load.

Kicks the user out if they're not in the game.
*/
function checkUser() {
  if (currentUser === undefined && currentGame === undefined) {
    setTimeout(checkUser, 100);
  } else if (!currentGame.players.includes(currentUser.username)) {
    let content = document.getElementsByTagName("body")[0];
    content.innerHTML =
      "<div class='return'><p>Hey! You're not supposed to be here!<p><button class='returnHome' onclick='returnHome()'>Return to Lobby</button></div>";
  }
}

/* 'returnHome()':
Activates on button click, moving the player back to the
home page.
*/
function returnHome() {
  window.location.replace(`${window.location.origin}/game/home.html`);
}

/* 'ping()'
This function is called every 1 second.
Sends a 'GET' request to the server to get game information.
*/
function ping() {
  let pingg = fetch(`ping/${currentUser.username}`)
    .then((response) => {
      return response.text();
    })
    .then((data) => {
      let results = JSON.parse(data);
      if (results["status"] == "incoming") {
        addToPool([results["tile"]]);
      } else if (results["status"] == "banana") {
        let button = document.getElementById("peel_banana");
        button.innerText = "BANANAS";
        bananas = true;
      } else if (results["status"] == "game_over") {
        if (results["winners"].includes(currentUser.username)) {
          if (results["winners"].length == 1) {
            window.alert("You Won!");
          } else {
            let loser = results["losers"][0];
            window.alert(`You Won!\n${loser.username} submitted invalid words!`);
          }
        } else {
          window.alert("You Lost!");
        }
        // redirect to the end page
        window.location.replace(`${window.location.origin}/game/end.html`);
      }
    });
}

/* 'peelBanana()'
This function is called when a player tries to peel.
Sends a 'POST' request to the server to submit a request to peel.
*/
function peelBanana() {
  if (bananas) {
    if (verifyPeel()) {
      console.log("sending bananas");
      let words = makeWordList();
      let package = { user: currentUser.username, words: words };
      let peel = fetch("peel", {
        method: "POST",
        body: JSON.stringify(package),
        headers: { "Content-Type": "application/json" },
      }).then((response) => {
        return response.text();
      });
    }
  } else if (verifyPeel()) {
    let package = { user: currentUser.username };
    let peel = fetch("peel", {
      method: "POST",
      body: JSON.stringify(package),
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      return response.text();
    });
  }
}

/* 'verifyPeel()'
This function looks at the tiles on the board and verifies if a player is allowed to peel.
(A player is allowed to peel if they have placed all of their tiles and they are in a
  connected grid)
It returns a boolean. 'true' if this player is allowed to peel. 'false' if this player is not allowed to peel.
*/
function verifyPeel() {
  let numTiles = 0;
  let userBoard = new Array(21);
  let start = [-1, -1];
  // translate to matrix
  for (let i = 0; i < 21; i++) {
    userBoard[i] = new Array(42);
    for (let j = 0; j < 42; j++) {
      let tile = document.getElementById(`x${i}y${j}`);
      if (containsTile(tile)) {
        numTiles += 1;
        userBoard[i][j] = tile.children[0].children[0].innerText;
        if (start[0] == -1) {
          start[0] = i;
          start[1] = j;
        }
      } else {
        userBoard[i][j] = undefined;
      }
    }
  }

  if (currentTiles.length != numTiles) {
    window.alert("Place all tiles on the board!");
    return false;
  }

  let connected = checkConnectivity(userBoard, start[0], start[1], numTiles);
  if (!connected) {
    window.alert("Connect your grid!");
    return false;
  }
  return true;
}

/* 'checkConnectivity()'
This function performs a BFS to check if the tiles on the board are in an interconnected grid

arr - the 2D array representing the board.
rowStart - an number representing the row to start searching at.
rowStart - an number representing the column to start searching at.
goal - the number of tiles a player should have interconnected.

returns - boolean true/false if the board is fully interconnected or not.
*/
function checkConnectivity(arr, rowStart, colStart, goal) {
  let seen = [];

  // this recursive helper function does the BFS and returns the number of interconnected tiles.
  function helper(row, col) {
    if (
      row < 0 ||
      row > 20 ||
      col < 0 ||
      col > 41 ||
      arr[row][col] === undefined ||
      seen.includes(`${row},${col}`)
    ) {
      return 0;
    }
    seen.push(`${row},${col}`);
    let count = 1 + helper(row - 1, col);
    count += helper(row + 1, col);
    count += helper(row, col - 1);
    count += helper(row, col + 1);
    return count;
  }

  let count = helper(rowStart, colStart);
  return count == goal;
}

/* 'makeWordList()'
This function makes the list of words that are formed by the tiles on the board.

arr - the 2D array representing the board.

returns - an array of words.
*/
function makeWordList(board) {
  let words = [];
  let curr = "";

  // check horizontally
  for (let i = 0; i < userBoard.length; i++) {
    addWord();
    curr = "";
    for (let j = 0; j < userBoard[0].length; j++) {
      if (userBoard[i][j] === undefined) {
        addWord();
        curr = "";
      } else {
        curr += userBoard[i][j];
      }
    }
  }

  // check vertically
  for (let i = 0; i < userBoard[0].length; i++) {
    addWord();
    curr = "";
    for (let j = 0; j < userBoard.length; j++) {
      if (userBoard[j][i] === undefined) {
        addWord();
        curr = "";
      } else {
        curr += userBoard[j][i];
      }
    }
  }

  // helper function to add words to the wordlist if they are longer than 1 character.
  function addWord() {
    if (curr.length > 1) {
      words.push(curr);
    }
  }

  return words;
}


/* 'dumpTile()'
This function is called when a player 'dumps' a tile (exchanges one tile for three new ones)
It makes a 'POST' request to the server, sending the username of the player making the request
  and the letter representing the tile being exchanged.
*/
function dumpTile() {
  if (selectedTileId == "") {
    window.alert("Please select a tile to dump first!");
  } else {
    let oldTile = document.getElementById(selectedTileId);
    let newTiles = fetch("dump", {
      method: "POST",
      body: JSON.stringify({ tile: oldTile.innerText, user: currentUser.username }),
      headers: { "Content-Type": "application/json" },
    });

    newTiles
      .then((response) => {
        return response.text();
      })
      .then((newTiles) => {
        let tiles = JSON.parse(newTiles);
        addToPool(tiles["tiles"]);
      })
      .catch((err) => window.alert(err));
    oldTile.parentElement.innerHTML = "";
    selectedTileId = "";
  }
}

/* 'addToPool()'
This function takes a list of letters and uses makeTile() to turn them into HTML code and 
changes the HTML code in game.html to visually show the new letters in the pool.
*/
function addToPool(tiles) {
  let pool = document.getElementById("tilePool");
  let poolHTML = "";
  currentTiles = currentTiles.concat(tiles);
  for (let i = 0; i < tiles.length; i++) {
    poolHTML += makeTile(tiles[i]);
  }
  pool.innerHTML += poolHTML;
}

/* 'generateGrid()':
Generates a 42x21 grid as the playable space and updates game.html
*/
function generateGrid() {
  let grid = document.getElementById("playspace");
  let gridHTML = "";
  for (let i = 0; i < 21; i++) {
    gridHTML += "<tr>";
    for (let j = 0; j < 42; j++) {
      gridHTML += `<td class="gridTile" id="x${i}y${j}" onclick="selectGridTile(this.id)"></td>`;
    }
    gridHTML += "</tr>";
  }
  grid.innerHTML = gridHTML;
}

/* 'selectTile()':
This function 'selects' a tile from the pool that the user clicks on. This can result in the tile
being highlighted, unhighlighted, or swapped with another selected tile.

id - the HTML id of the tile to be selected
*/
function selectTile(id) {
  let tile = document.getElementById(id);
  // case 1: first tile selected:
  if (selectedTileId == "") {
    // set border color and to selected tile
    selectedTileId = id;
    tile.style.borderColor = "red";
  }
  // case 2: already selected
  else if (selectedTileId == id) {
    // unset border color and to selected tile
    selectedTileId = "";
    tile.style.borderColor = "rgb(59, 31, 24)";
  }
  // case 3: second tile selected:
  else {
    // swap tiles
    let other = document.getElementById(selectedTileId);
    let temp = other.innerHTML;
    other.innerHTML = tile.innerHTML;
    tile.innerHTML = temp;
    other.style.borderColor = "rgb(59, 31, 24)";
    selectedTileId = "";
  }
}

/* 'selectGridTile()':
This function 'selects' a tile on the grid that the user clicks on. This can result in the tile
being highlighted, unhighlighted, or swapped with another selected tile.

id - the HTML id of the tile to be selected
*/
function selectGridTile(id) {
  let gridTile = document.getElementById(id);
  // case 1: bananagram placed
  if (containsTile(gridTile)) {
    return;
  }
  // case 2: empty grid tile
  else if (selectedTileId != "") {
    let oldTile = document.getElementById(selectedTileId);
    gridTile.innerHTML = makeGridTile(oldTile.innerText);
    oldTile.parentElement.innerHTML = "";
    selectedTileId = "";
    oldTile.style.borderColor = "rgb(59, 31, 24)";
  }
}

/* 'makeTile()':
This function takes a letter and turns into HTML code representing a tile in the pool.

letter - the letter to be turned into a tile.

returns - the HTML code representing a tile in the pool.
*/
function makeTile(letter) {
  count += 1;
  return `<div class="wrap"><div class="bananaTile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div></div>`;
}

/* 'makeGridTile()':
This function takes a letter and turns into HTML code representing a tile in the grid.

letter - the letter to be turned into a tile.

returns - the HTML code representing a tile in the grid.
*/
function makeGridTile(letter) {
  count += 1;
  return `<div class="bananaGridtile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div>`;
}


/* 'containsTile()':
This function takes an HTML element and checks if that element contains a tile.

element - the HTML element to check

returns - true/false whether or not that element contains a tile.
*/
function containsTile(element) {
  return element.innerHTML.includes("banana");
}
