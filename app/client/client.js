// your_single_js_file.js

// Function to handle logout
async function handleLogout(event) {
  event.preventDefault();

  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (response.status === 200) {
      window.location.href = '/';
    }
  });
}

async function handleHome(event) {
  event.preventDefault();

  fetch('/home', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (response.status === 200) {
      window.location.href = '/home';
    }
  });
}

async function handleRegister(event) {
  event.preventDefault();

  var encoder = new TextEncoder();
  var data = encoder.encode(document.getElementById('password').value);
  var hash = await window.crypto.subtle.digest('SHA-256', data);
  var hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  let body = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    username: document.getElementById('username').value,
    password: hashedPassword,
    type: "client",
  }

  fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  }).then(response => {
    if (response.status === 200) {
      window.location.href = '/home';
    } else if (response.status === 401) {
      document.getElementById('error-message').innerHTML = 'Username already exists';
    }
  });
}

if(window.location.pathname === '/register') {
  document.getElementById('registration-form').addEventListener('submit', handleRegister);
}

// Check the current page and add the logout event listener if on the dashboard page
if (window.location.pathname === '/home') {
  document.getElementById('logout').addEventListener('click', handleLogout);
  let meetings = JSON.parse(localStorage.getItem("meetings"));
  for(let i = 0; i < meetings.length; i++) {
    let meeting = meetings[i];
    let table = document.getElementById('meeting-table');
    let row = table.insertRow();
    let meetingName = row.insertCell(0);
    let meetingDate = row.insertCell(1);
    let meetingTime = row.insertCell(2);
    let meetingRoom = row.insertCell(3);
    let attendees = row.insertCell(4);
    let type = row.insertCell(5);
    meetingName.innerHTML = meeting.meetingName;
    meetingDate.innerHTML = meeting.meetingDate;
    meetingTime.innerHTML = meeting.meetingTime;
    meetingRoom.innerHTML = meeting.meetingRoom;
    attendees.innerHTML = meeting.attendees;
    type.innerHTML = meeting.type;
  }
}

if (window.location.pathname === '/client-profile') {
  console.log(localStorage.getItem("firstName"));
  console.log(localStorage.getItem("lastName"));
  console.log(localStorage.getItem("type"));
  document.getElementById('logout').addEventListener('click', handleLogout);
  document.getElementById("firstName").innerHTML = localStorage.getItem("firstName");
  document.getElementById("lastName").innerHTML = localStorage.getItem("lastName");
}

if (window.location.pathname === '/create-meeting') {
  document.getElementById('create-meeting-form').addEventListener('submit', async function (event){
    event.preventDefault();
    let type = document.getElementsByName('room-type');
    for(let i = 0; i < type.length; i++) {
      if(type[i].checked) {
        type = type[i].value;
        break;
      }
    }
    await fetch('/create-meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizer: localStorage.getItem("username"),
        meetingName: document.getElementById('meeting-name').value,
        meetingDate: document.getElementById('date').value,
        meetingTime: document.getElementById('time').value,
        meetingRoom: document.getElementById('room').value,
        attendees: document.getElementById('attendees').value,
        type: type,
      })
    }).then(response => {
      console.log(response);
      if (response.status === 200) {
        // add meeting to existing meetings in local storage
        let meetings = JSON.parse(localStorage.getItem("meetings"));
        let type = document.getElementsByName('room-type');
        for(let i = 0; i < type.length; i++) {
          if(type[i].checked) {
            type = type[i].value;
            break;
          }
        }
        let newMeeting = {
          organizer: localStorage.getItem("username"),
          meetingName: document.getElementById('meeting-name').value,
          meetingDate: document.getElementById('date').value,
          meetingTime: document.getElementById('time').value,
          meetingRoom: document.getElementById('room').value,
          attendees: document.getElementById('attendees').value,
          type: type,
        };
        meetings.push(newMeeting);
        localStorage.setItem('meetings', JSON.stringify(meetings));
        }
    });
  });
}

if(window.location.pathname === '/') {
  document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    console.log('here');

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    var encoder = new TextEncoder();
    var data = encoder.encode(password);
    var hash = await window.crypto.subtle.digest('SHA-256', data);
    var hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: hashedPassword
      })
    }).then( response => {
      if(response.status === 200) {
        response.json().then(data => {
          localStorage.setItem('username', username),
          localStorage.setItem('firstName', data.firstName);
          localStorage.setItem('lastName', data.lastName);
          localStorage.setItem('type', data.type);
          localStorage.setItem('meetings', JSON.stringify(data.meetings));
          localStorage.setItem('attendee', JSON.stringify(data.attendee));
          localStorage.setItem('complaints', JSON.stringify(data.complaints));
        });
        window.location.href = '/home';
      } else {
        document.getElementById('error-message').innerText = 'Invalid username or password';
      }
    })
  });
}

