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

var currentUser;
var currentTiles = [];
var selectedTileId = "";
var count = 0;
var words = [];

setTimeout(getUser, 0);
setTimeout(checkUser, 0);
setInterval(ping, 1000);

// TODO: REMOVE ONCE INFO GRABBED FROM SERVER
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

/* 'checkUser()':
Called automatically by the server on load.

Kicks the user out if they're not in the game.
*/
function checkUser() {
  if (currentUser == undefined) {
    setTimeout(checkUser, 0);
  } else if (!currentUser.inGame) {
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

// ping server every second for game status
function ping() {
  let pingg = fetch(`ping/${currentUser.username}`)
    .then((response) => {
      return response.text();
    })
    .then((pingg) => {
      let newTiles = JSON.parse(pingg);
      console.log(newTiles);
      addToPool([newTiles["tile"]]);
    });
}

// peels
function peelBanana() {
  console.log("peel");
  if (true) {
    //(verifyPeel()) {
    let package = { user: currentUser.username };
    let peel = fetch("peel", {
      method: "POST",
      body: JSON.stringify(package),
      headers: { "Content-Type": "application/json" },
    });

    peel.then((response) => {
      return response.text();
    });
  }
}

// verify if you are allowed to peel, returns boolean true if peel is allowed and false if peel is not allowed
function verifyPeel() {
  let numTiles = 0;
  let userBoard = new Array(21);
  let x;
  let y;
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
  if (currentTiles.length != 0) {
    window.alert("Place all tiles on the board!");
    return false;
  }

  return checkConnectivity(userBoard, start[0], start[1], numTiles);
}

// checks if the tiles in the board are fully connected
function checkConnectivity(arr, rowStart, colStart, goal) {
  let seen = [];

  function helper(row, col) {
    calls += 1;
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

// makes the list of words on the freakin board
function makeWordList(board) {
  let words = [];
  let curr = "";

  // check horizontally
  for (let i = 0; i < board.length; i++) {
    addWord();
    curr = "";
    for (let j = 0; j < board[0].length; j++) {
      if (board[i][j] === undefined) {
        addWord();
        curr = "";
      } else {
        curr += board[i][j];
      }
    }
  }

  // check vertically
  for (let i = 0; i < board[0].length; i++) {
    addWord();
    curr = "";
    for (let j = 0; j < board.length; j++) {
      if (board[j][i] === undefined) {
        addWord();
        curr = "";
      } else {
        curr += board[j][i];
      }
    }
  }

  function addWord() {
    if (curr.length > 1) {
      words.push(curr);
    }
  }

  return words;
}

function dumpTile() {
  if (selectedTileId == "") {
    window.alert("Please select a tile to dump first!");
  } else {
    let oldTile = document.getElementById(selectedTileId);
    let newTiles = fetch(`dump/${currentUser.username}`, {
      method: "POST",
      body: JSON.stringify({ tile: oldTile.innerText }),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        newTiles = response.text();
      })
      .then((newTiles) => {
        let tiles = JSON.parse(newTiles);
        addToPool(tiles[tiles]);
      })
      .catch((err) => window.alert(err));
    //let newTiles = ['E', 'X', 'Z'];
    oldTile.parentElement.innerHTML = "";
    selectedTileId = "";
    //addToPool(newTiles);
  }
}

function addToPool(tiles) {
  let pool = document.getElementById("tilePool");
  let poolHTML = "";
  currentTiles = currentTiles.concat(tiles);
  for (let i = 0; i < tiles.length; i++) {
    // TODO: add limit to size of row
    poolHTML += makeTile(tiles[i]);
  }
  pool.innerHTML += poolHTML;
}

/* 'generateGrid()':
Generates a 42x21 grid as the playable space
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

function makeTile(letter) {
  count += 1;
  return `<div class="wrap"><div class="bananaTile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div></div>`;
}

function makeGridTile(letter) {
  count += 1;
  return `<div class="bananaGridtile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div>`;
}

function containsTile(element) {
  return element.innerHTML.includes("banana");
}
