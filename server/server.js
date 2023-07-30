const express = require("express");
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const data = require('../database/data.json');

const app = express();

app.use(express.json(), cookieParser());
app.use(express.static(path.join(__dirname, '../app')));
app.use(express.static(path.join(__dirname, '../database')));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../app/pages/login.html")));

app.post('/login', (req, res) => handleLoginRequest(req, res));
app.post('/register', (req, res) => handleRegisterRequest(req, res));
app.post('/logout', (req, res) => res.clearCookie('session').json({ message: 'Logout successful' }));

app.get('/client-home', (req, res) => handleClientHomeRequest(req, res));
app.get('/admin-home', (req, res) => handleAdminHomeRequest(req, res));
app.get('/client-profile', (req, res) => handleClientProfileRequest(req, res));
app.get('/create-meeting', (req, res) => handleCreateMeetingRequest(req, res));
app.post('/create-meeting', (req, res) => handlePostCreateMeetingRequest(req, res));
app.get('/file-complaint', (req, res) => handleFileComplaintRequest(req, res));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, "../app/pages/registration.html")));

app.listen(3000, () => console.log("Server is Running"));

function handleLoginRequest(req, res) {
  let {username, password: hashedPassword} = req.body;
  let users = data['users'];

  if(users[username] && users[username].password === hashedPassword) {
    let sessionId = uuidv4();

    // Remove all previous sessions for the user
    for(let session in data['sessions']) {
      if(data['sessions'][session].username === username) {
        delete data['sessions'][session];
      }
    }

    // Add a new session to the data
    data['sessions'][sessionId] = {username, expires: Date.now() + 3600000};

    // Write the updated data back to the JSON file
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(data), (err) => {
      if(err) {
        return res.status(500).json({message: 'Error updating session information'});
      }
    });

    // Set the session ID as a cookie
    res.cookie('sessionId', sessionId, { maxAge: 3600000, httpOnly: true });
    res.json({redirectTo: users[username].type === 'client' ? '/client-home' : '/admin-home'})
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
}


function handleRegisterRequest(req, res) {
  console.log(req.body);
  let username = req.body.username;
  let hashedPassword = req.body.password;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let type = req.body.type;
  let users = data['users'];
  if(users[username]) {
    res.status(401).json({ message: 'Username already exists' });
  } else {
    let newData = data;
    let sessionId = uuidv4();
    newData['users'][username] = {
      username: username,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      type: type
    };
    newData['sessions'][sessionId] = {
      username: username,
    };
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function(err) {});
    res.cookie('sessionId', sessionId, { maxAge: 3600000, httpOnly: true });
    res.json({ firstName: firstName, lastName: lastName, type: type, meetings: [], attendee: [], complaints: [] });
  }
}

function handleClientHomeRequest(req, res) {
  console.log(req.cookies.sessionId);
  console.log(data['sessions'][req.cookies.sessionId])
  if(checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    res.sendFile(path.join(__dirname, "../app/pages/client-home.html"));
  }
  else {
    res.redirect('/');
  }
}

function handleAdminHomeRequest(req, res) {
  if(checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    res.sendFile(path.join(__dirname, "../app/pages/admin-home.html"));
  }
}

function handleClientProfileRequest(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/client-profile.html"));
  }
}

function handleCreateMeetingRequest(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/create-meeting.html"));
  }
}

function handlePostCreateMeetingRequest(req, res) {
  if(req.cookies.session === '1') {
    let newData = data;
    newData['meetings'].push(req.body);
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function(err) {});
    res.json({ data: newData });
  }
}

function handleFileComplaintRequest(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/file-complaint.html"));
  }
}

function checkSession(sessionId) {
  if(sessionId && data['sessions'][sessionId] && data['sessions'][sessionId]['expires'] > Date.now()) {
    return true;
  }
  return false;
}

function checkPermission(sessionId, permission) {
  if(checkSession(sessionId)) {
    let username = data['sessions'][sessionId]['username'];
    if(data['users'][username]['type'] === permission) {
      return true;
    }
  }
  return false;
}