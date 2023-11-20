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

// TODO: REMOVE ONCE INFO GRABBED FROM SERVER
window.onload = () => {
    let friendsList = {'jonathan': 77, 'davin': 52, 'ceecee': 81};
    setTitle('helsinki');
    generateLobby('waiting_host', 3);
    generateStats(12, 50)
    for (const key in friendsList) {
        generateFriend(key, friendsList[key]);
    }
};

// SERVER COMMUNICATION
/* 'joinGame()':
Trigger a ping to the server to determine if a user
can join a game in the lobby

Will call generateLobby.
*/
function joinGame() {
    // TODO: this
}

/* 'joinGame()':
Trigger the start of a game, moving all players in the
waiting lobby to the game screen
*/
function startGame() {
    // TODO: this
}

// UI GENERATION

/* 'generateLobby()':
Generate the lobby visuals
cases:
    - open: join game button available
    - waiting
        - if host: add start button
        - else: current number of players waiting
    - active: display game in progress
*/
function generateLobby(status, current_players=0) {
    let lobby = document.getElementById("lobby"); 
    switch (status) {
        case 'open':
            lobby.innerHTML = '<button class="join" onclick="joinGame()">JOIN GAME</button>';
            return
        case 'waiting':
            lobby.innerHTML = `<div class="waiting"><p>waiting for players...</p><p>${current_players}/4</p></div>`;
            return
        case 'waiting_host':
            lobby.innerHTML = `<div class="waiting"><p>waiting for players...</p><p>${current_players}/4</p><button class="join" onclick="startGame()">START GAME</button></div>`;
            return
        case 'active':
            lobby.innerHTML = '<div id="active">GAME IN PROGRESS...</div>';
            return
        default:
            console.log(`ERROR RESOLVING LOBBY STATUS: ${status}`);
    }
}

/* 'setTitle()':
Sets the title component of the home page using
styled bananagram tiles
username: username of user
*/
function setTitle(username) {
    let title = document.getElementById('welcome_user');
    let userText = username.toUpperCase();
    let welcome = 'WELCOME';
    let titleHTML = '<div class="row">';
    for (let i = 0; i < welcome.length; i++) {
        titleHTML += styledBananaTile(welcome[i]);
    }
    titleHTML += '</div><div class="row">'
    for (let i = 0; i < userText.length; i++) {
        titleHTML += styledBananaTile(userText[i]);
    }
    titleHTML += '</div>'
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

/* 'generateStats()':
Calculates the user statistics based off the given wins and total games
played for a user and sets those values into the ui table component
*/
function generateStats(wins, total) {
    let win_count = document.getElementById('win_count');
    win_count.innerText = wins;
    let lose_count = document.getElementById('lose_count');
    lose_count.innerText =  total - wins;
    let total_games = document.getElementById('total_games');
    total_games.innerText = total
    let win_rate = document.getElementById('win_rate');
    win_rate.innerText = `${(wins/total)*100}%`;
}