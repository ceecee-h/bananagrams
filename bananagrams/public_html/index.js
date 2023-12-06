/* 
Name: Davin Bush, CeeCee Hill, Jonathan Houge
Course: CSC 337 - Web Programming
Assignment: Final Project - Bananagrams
File: index.js
Date: 11/13/23

This is 'index.js', the client javascript file for account handling within 'Bananagrams'.
The HTML pages 'index.html' and 'create.html' utilize this file.
It allows the client to create/submit their own users.
It sends out HTTP requests with 'createUser()' and 'loginUser()'.
It sends 'POST' requests to ensure the privacy of the data sent.
*/

/* 'loginUser()':
Called by clicking the 'login' button on 'index.html'.

Used to send a 'POST' request to the server to get a user.
Calls helper function to gather inputs, check inputs, and create a package.
Package is then turned into a JSON file and sent to the server.
Status code response dictates whether or not the user will be redirected.
*/
function loginUser() {
  let package = userPackager();
  if (JSON.stringify(package) == "{}") return; // there was a problem

  // displays, in red text, "Issue logging in with that info.", if server returns an error
  let errorText = document.getElementById("problem");

  let p = fetch("/login", {
    method: "POST",
    body: JSON.stringify(package),
    headers: { "Content-Type": "application/json" },
  });

  p.then((response) => {
    return response.status;
  })
    .then((status) => {
      if (status == 200) window.location.replace(`${window.location.origin}/game/home.html`);
      else errorText.style.display = "block"; // show error text
    })
    .catch((error) => {
      console.log("THERE WAS A PROBLEM");
      console.log(error);
      errorText.style.display = "block"; // show error text
    });
}

/* 'createUser()':
Called by clicking the 'create' button on 'create.html'.

Used to send a 'POST' request to the server to create a user.
Calls helper function to gather inputs, check inputs, and create a package.
Package is then turned into a JSON file and sent to the server.
The server sends back a confirmation message.
*/
function createUser() {
  let package = userPackager();
  if (JSON.stringify(package) == "{}") return; // there was a problem

  let p = fetch("/create", {
    method: "POST",
    body: JSON.stringify(package),
    headers: { "Content-Type": "application/json" },
  });

  p.then((response) => {
    return response.text();
  })
    .then((text) => {
      window.alert(text); // message (success or error) from server, tell user result of operation

      // if successful, redirect to the login page
      if (text == "USER CREATED") window.location.replace(`${window.location.origin}`);
    })
    .catch((error) => {
      console.log("THERE WAS A PROBLEM");
      console.log(error);
      window.alert("USER CREATION: An error occurred.");
    });
}

/* 'userPackager()':
Helper function for user related operations, used by 'createUser()' and 'loginUser()'.

Gathers the necessary client inputs, does some light error checking
on them, and then returns an object back,
either an empty one if there was a problem or a proper one to be used in the 'POST'.
*/
function userPackager() {
  // gathering
  let user = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  // light error checking & return
  if (user == "" || password == "") {
    window.alert("User Creation: Missing an input!");
    return {};
  } else return { user: user, password: password };
}
