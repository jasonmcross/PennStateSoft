// Importing express module
const express = require("express");
const app = express();

// Parse incoming JSON
app.use(express.json());

// Define users here
const users = {
  "t": { password: "e3b98a4da31a127d4bde6e43033f66ba274cab0eb7eb1c70ec41402bf6273dd8" },
};

// Used to bring the static CSS files into the server
app.use(express.static(`${__dirname}/app`));

// Handling GET / request
app.get("/", (req, res) => {
  res.sendFile("./app/pages/login.html", { root: __dirname });
});

// Handling POST /login request
app.post('/login', function(req, res) {
  console.log(req);
  let username = req.body.username;
  let hashedPassword = req.body.password;

  if(users[username] && users[username].password === hashedPassword) {
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Server setup
app.listen(3000, () => {
  console.log("Server is Running");
});
