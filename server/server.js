// Importing express module
const express = require("express");
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');  // Importing cookie-parser
const data = require('../database/data.json');  // Importing users.json
const fs = require('fs');

const { v4: uuidv4 } = require('uuid');

// Parse incoming JSON
app.use(express.json());

app.use(cookieParser());  // Use cookie-parser middleware

// Used to bring the static CSS files into the server
app.use(express.static(path.join(__dirname, '../app')));
app.use(express.static(path.join(__dirname, '../database')));

// Handling GET / request

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../app/pages/login.html");
  res.sendFile(filePath);
});

// Handling POST /login request
app.post('/login', function(req, res) {
  let username = req.body.username;
  let hashedPassword = req.body.password;
  let users = data['users'];
  if(users[username] && users[username].password === hashedPassword) {
    res.cookie('session', '1', { maxAge: 3600000, httpOnly: true });
    let meetings = data.meetings.filter(meeting => meeting.organizer === username);
    let attendee = data.meetings.filter(meeting => meeting.attendees.includes(username));
    let complaints = data.complaints.filter(complaint => complaint.username === username);
    // Send back the user's first name, last name, and type, along with all rooms, meetings where they are an organizer or in the list of attendees, or complaints they have file
    res.json({ firstName: users[username].firstName, lastName: users[username].lastName, type: users[username].type, meetings: meetings, attendee: attendee, complaints: complaints });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

app.post('/register', function(req, res) {
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
    newData['users'][username] = {
      username: username,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      type: type
    };
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function(err) {});
    res.cookie('session', '1', { maxAge: 3600000, httpOnly: true });
    res.json({ firstName: firstName, lastName: lastName, type: type, meetings: [], attendee: [], complaints: [] });
  }
});

app.post('/logout', function(req, res) {
  res.clearCookie('session');
  res.json({ message: 'Logout successful' });
});

app.get('/home', function(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/home.html"));
  }
  else {
    res.redirect('/');
  }
})

app.get('/client-profile', function(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/client-profile.html"));
  }
})

app.get('/create-meeting', function(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/create-meeting.html"));
  }
})

app.post('/create-meeting', function(req, res) {
  if(req.cookies.session === '1') {
    let newData = data;
    let meetingData = req.body
    meetingData['id'] = uuidv4()
    newData['meetings'].push(meetingData);
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function(err) {});
    res.statusCode = 201
    res.json({ data: newData });
  }
});

app.get('/meeting/:id', function(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/meeting-detail.html"));
  }
})

app.get('/file-complaint', function(req, res) {
  if(req.cookies.session === '1') {
    res.sendFile(path.join(__dirname, "../app/pages/file-complaint.html"));
  }
})

app.get('/register', function(req, res) {
  res.sendFile(path.join(__dirname, "../app/pages/registration.html"));
});

// Server setup
app.listen(3000, () => {
  console.log("Server is Running");
});
