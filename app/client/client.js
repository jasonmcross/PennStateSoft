if (window.location.pathname === '/register') {
  document.getElementById('registration-form').addEventListener('submit', handleRegister);
}

if (window.location.pathname === '/client-home') {
  document.getElementById('logout').addEventListener('click', handleLogout);
  let userData = JSON.parse(localStorage.getItem("userData"));
  let meetings = userData.meetings;
  for (let i = 0; i < meetings.length; i++) {
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

let url_arr = window.location.href.split("/")
if (url_arr[url_arr.length-2] === "meeting") {
  console.log('On the meeting page')
  let meetings = JSON.parse(localStorage.getItem("meetings"));
  let currentMeeting = meetings.filter(meeting => meeting.id === url_arr[url_arr.length-1])[0];
  let attend_arr = currentMeeting.attendees.split(", ");
  let ul = document.getElementById('attendees-list');

  attend_arr.forEach(renderProductList);

  function renderProductList(element, index, arr) {
      var li = document.createElement('li');
      li.setAttribute('class','item');

      ul.appendChild(li);

      li.innerHTML= element;
  }
  document.getElementById("meeting-date").innerHTML = currentMeeting.meetingDate
  document.getElementById("meeting-name").innerHTML = currentMeeting.meetingName
  document.getElementById("meeting-room").innerHTML = currentMeeting.meetingRoom
  document.getElementById("meeting-time").innerHTML = currentMeeting.meetingTime
  document.getElementById("organizer").innerHTML = currentMeeting.organizer
  document.getElementById("room-type").innerHTML = currentMeeting.type
  //Currently reprints attendees as just one string. Not as list elements
  document.getElementById("attendees-list").innerHTML = currentMeeting.attendees
}
if (window.location.pathname === '/create-meeting') {
  document.getElementById('logout').addEventListener('click', handleLogout);
  document.getElementById('create-meeting-form').addEventListener('submit', handleCreateMeeting);
}

if (window.location.pathname === '/file-complaint') {
  document.getElementById('logout').addEventListener('click', handleLogout);
}

if (window.location.pathname === '/') {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

if (window.location.pathname === '/client-profile') {
  document.getElementById('logout').addEventListener('click', handleLogout);
  let userData = JSON.parse(localStorage.getItem("userData"));
  document.getElementById("firstName").innerHTML = userData['firstName'];
  document.getElementById("lastName").innerHTML = userData['lastName'];
  document.getElementById("first").value = userData['firstName'];
  document.getElementById("last").value = userData['lastName'];

  document.getElementById("edit-profile-form").addEventListener("submit", handleEditProfile);

  document.getElementById('edit-payment-btn').onclick = function() {
    let form = document.getElementById('edit-payment-form');
    let achForm = document.getElementById('ach-details');
    if(form.style.display === 'block'){
      form.style.display = 'none';
      achForm.style.display = 'none';
    }
    else{
      form.style.display = 'block';
      achForm.style.display = 'block';
    }
  }
  document.getElementById('payment-method').onchange = function() {
    let achForm = document.getElementById('ach-details');
    let ccForm = document.getElementById('credit-card-details');
    if (document.getElementById('payment-method').value === 'ach') {
      achForm.style.display = 'block';
      ccForm.style.display = 'none';
    }
    else {
      achForm.style.display = 'none';
      ccForm.style.display = 'block';
    }
  }

  document.getElementById('edit-profile-btn').onclick = function() {
    let form = document.getElementById('edit-profile-form');
    if(form.style.display === 'block'){
      form.style.display = 'none';
    }
    else{
      form.style.display = 'block';
    }
  }

  document.getElementById('edit-payment-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    let paymentMethod = document.getElementById('payment-method').value;
    if (paymentMethod === 'ach') {
      await fetch('/payment-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: paymentMethod,
          routingNumber: document.getElementById('routing-number').value,
          accountNumber: document.getElementById('account-number').value,
          accountName: document.getElementById('full-name-ach').value,
        })
      }).then(response => {
        if (response.status === 200) {
          response.json().then(body => {
            window.location.href = '/client-profile';
          })
        }
      });
    } else {
      await fetch('/payment-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: paymentMethod,
          cardNumber: document.getElementById('card-number').value,
          cardName: document.getElementById('full-name-cc').value,
          expirationDate: document.getElementById('billing-zip').value,
          securityCode: document.getElementById('security-code').value,
        })
      }).then(response => {
        if (response.status === 200) {
          response.json().then(body => {
            window.location.href = '/client-profile';
          })
        }
      });
    }
  });
}

async function handleLogin(event) {
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
  }).then(response => {
    if (response.status === 200) {
      response.json().then(data => {
        localStorage.setItem("userData", JSON.stringify(data['userData']));
        window.location.href = data.redirectTo;
      });
    } else if (response.status === 401) {
      document.getElementById('error-message').innerHTML = 'Invalid username or password';
    }
  });
}

async function handleCreateMeeting(event) {
  event.preventDefault();
  let type = document.getElementsByName('room-type');
  for (let i = 0; i < type.length; i++) {
    if (type[i].checked) {
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
    if (response.status === 200) {
      response.json().then(data => {
        localStorage.setItem("userData", JSON.stringify(data['userData']));
      });
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

async function handleEditProfile(event) {
  event.preventDefault();
  let form = document.getElementById('edit-profile-form');
  await fetch ('/edit-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: form.elements[0].value,
      lastName: form.elements[1].value,
    })
  }).then(response => {
    if (response.status === 200) {
      response.json().then(body => {
        localStorage.setItem('userData', JSON.stringify(body.data));
        window.location.href = '/client-profile';
      })
    }
  })
}