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

// TODO: REMOVE ONCE INFO GRABBED FROM SERVER
window.onload = () => {
    generateGrid();
    addToPool(['A', 'B', 'C'])
};

function addToPool(tiles) {
    let pool = document.getElementById('tile_pool');
    let poolHTML = '';
    currentTiles = currentTiles.concat(tiles);
    for (let i = 0; i < currentTiles.length; i++) {
        // TODO: add limit to size of row
        poolHTML += makeTile(currentTiles[i]);
        count += 1;
    }
    pool.innerHTML = poolHTML;
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
        let temp = other.innerText;
        other.innerText = tile.innerText;
        tile.innerText = temp;
        tile.style.borderColor = 'rgb(59, 31, 24)';
        selectedTileId = '';
    }
}

function selectGridTile(id) {
    let gridTile = document.getElementById(id);
    if (selectedTileId != '') {
        let oldTile = document.getElementById(selectedTileId);
        gridTile.innerHTML = makeTile(oldTile.innerText);
        oldTile.parentElement.innerHTML = "";
        selectedTileId = '';
    }
}

function makeTile(letter) {
    return `<div class="wrap"><div class="banana_tile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div></div>`;
}

function makeGridTile(letter) {
    return `<div class="banana_gridtile" id="${count}" onclick="selectTile(this.id)"><b>${letter}</b></div>`;
}