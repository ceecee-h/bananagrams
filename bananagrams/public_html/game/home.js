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
    setTitle('inky');
};

/* 'setTitle()':
Sets the title component of the home page using
styled bananagram tiles
*/
function setTitle(username) {
    let title = document.getElementById('welcome_user');
    let welcomeText = `WELCOME${username.toUpperCase()}`;
    let titleHTML = '';
    for (let i = 0; i < welcomeText.length; i++) {
        titleHTML += styledBananaTile(welcomeText[i]);
    }
    title.innerHTML = titleHTML;
}


/* 'styledBananaTile()':
Builds the ui component for a bananagram tile, for stylistic
purposes only on the home page.

Takes a letter and returns the html needed to embed a tile.
*/
function styledBananaTile(letter) {
    return `<div class="banana_tile"><b>${letter}</b></div>`;
}