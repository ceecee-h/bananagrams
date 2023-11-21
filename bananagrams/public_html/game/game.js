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

var currentTiles = [];
var selectedTileId = '';
var count = 0;
var words = [];

// TODO: REMOVE ONCE INFO GRABBED FROM SERVER
window.onload = () => {
    generateGrid();
    addToPool(['A', 'A', 'B', 'C', 'E', 'E', 'E', 
                'F', 'H', 'I', 'L', 'K', 'M', 'M',
                'P', 'Q', 'R', 'S', 'S', 'T', 'U'])
};

function verifyPeel() {
    let numTiles = 0;
    let userBoard = new Array(21);
    let x;
    let y;
    // translate to matrix
    for (let i = 0; i < 21; i++) {
        userBoard[i] = new Array(42);
        for (let j = 0; j < 42; j ++) {
            let tile = document.getElementById(`x${i}y${j}`);
            if (containsTile(tile)) {
                numTiles += 1;
                userBoard[i][j] = tile.children[0].children[0].innerText;
            } else {
                userBoard[i][j] = undefined;
            }
        }
    }
    if (numTiles == 0) {
        window.alert('Place all tiles on the board!')
        return false
    }
    
}

function _backtrack(board, x, y, cur) {
    // TODO
    if (board[x][y] != undefined) {
        if (_backtrack(board, x+1, y, cur+ board[x][y])) {
            return true;
        }
        if (_backtrack(board, x, y-1, cur+ board[x][y])) {
            return true;
        }
        if (_backtrack(board, x-1, y, board[x][y] + cur)) {
            return true;
        }
        if (_backtrack(board, x, y+1, board[x][y] + cur)) {
            return true;
        }
    } else {
        words += cur;
        cur = '';
        return false;
    }
}

function isValid(board, x, y) {
    if ((x >= 21) || (y >= 42)) {
        return false;
    }
    if (board[x][y] == undefined) {
        return false;
    }
    return true;
}

function peel_banana() {

}

function dumpTile() {
    if (selectedTileId == '') {
        window.alert('Please select a tile to dump first!')
    }
    else {
        // TODO: add server call
        let newTiles = ['E', 'X', 'Z'];
        let oldTile = document.getElementById(selectedTileId);
        oldTile.parentElement.innerHTML = "";
        selectedTileId = '';
        addToPool(newTiles);
    }
}

function addToPool(tiles) {
    let pool = document.getElementById('tile_pool');
    let poolHTML = '';
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
    let gridHTML = '';
    for (let i = 0; i < 21; i++) {
        gridHTML += '<tr>';
        for (let j = 0; j < 42; j ++) {
            gridHTML += `<td class="gridTile" id="x${i}y${j}" onclick="selectGridTile(this.id)"></td>`;
        }
        gridHTML += '</tr>';
    }
    grid.innerHTML = gridHTML;
}

function selectTile(id) {
    let tile = document.getElementById(id);
    // case 1: first tile selected:
    if (selectedTileId == '') {
        // set border color and to selected tile
        selectedTileId = id;
        tile.style.borderColor = 'red';
    }
    // case 2: already selected
    else if (selectedTileId == id) {
        // unset border color and to selected tile
        selectedTileId = '';
        tile.style.borderColor = 'rgb(59, 31, 24)';
    }
    // case 3: second tile selected:
    else {
        // swap tiles
        let other = document.getElementById(selectedTileId);
        let temp = other.innerHTML;
        other.innerHTML = tile.innerHTML;
        tile.innerHTML = temp;
        other.style.borderColor = 'rgb(59, 31, 24)';
        selectedTileId = '';
    }
}

function selectGridTile(id) {
    let gridTile = document.getElementById(id);
    // case 1: bananagram placed
    if (containsTile(gridTile)) {
        return
    }
    // case 2: empty grid tile
    else if (selectedTileId != '') {
        let oldTile = document.getElementById(selectedTileId);
        gridTile.innerHTML = makeGridTile(oldTile.innerText);
        oldTile.parentElement.innerHTML = "";
        selectedTileId = '';
        oldTile.style.borderColor = 'rgb(59, 31, 24)';
    }
}

function makeTile(letter) {
    count += 1;
    return `<div class="wrap"><div class="banana_tile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div></div>`;
}

function makeGridTile(letter) {
    count += 1;
    return `<div class="banana_gridtile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div>`;
}

function containsTile(element) {
    if (element.innerHTML.includes("banana")) {
        return true
    }
    return false;
}