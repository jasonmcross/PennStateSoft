if (window.location.pathname === '/register') {
  document.getElementById('registration-form').addEventListener('submit', handleRegister)
}

if (window.location.pathname === '/client-home') {
  document.getElementById('logout').addEventListener('click', handleLogout)
  generateMeetingTable()
}

const urlArr = window.location.href.split('/')
if (urlArr[urlArr.length - 2] === 'meeting') {
  const meetings = JSON.parse(localStorage.getItem('meetings'))
  const currentMeeting = meetings.filter(meeting => meeting.id === urlArr[urlArr.length - 1])[0]
  const attendArr = currentMeeting.attendees.split(', ')
  const ul = document.getElementById('attendees-list')

  attendArr.forEach(renderProductList)

  function renderProductList (element) {
    const li = document.createElement('li')
    li.setAttribute('class', 'item')

    ul.appendChild(li)

    li.innerHTML = element
  }
  document.getElementById('meeting-date').innerHTML = currentMeeting.meetingDate
  document.getElementById('meeting-name').innerHTML = currentMeeting.meetingName
  document.getElementById('meeting-room').innerHTML = currentMeeting.meetingRoom
  document.getElementById('meeting-time').innerHTML = currentMeeting.meetingTime
  document.getElementById('organizer').innerHTML = currentMeeting.organizer
  document.getElementById('room-type').innerHTML = currentMeeting.type
  // Currently reprints attendees as just one string. Not as list elements
  document.getElementById('attendees-list').innerHTML = currentMeeting.attendees
}
if (window.location.pathname === '/create-meeting') {
  document.getElementById('logout').addEventListener('click', handleLogout)
  document.getElementById('create-meeting-form').addEventListener('submit', handleCreateMeeting)
  document.addEventListener('DOMContentLoaded', populateAttendeesDropdown)
}

if (window.location.pathname === '/file-complaint') {
  document.getElementById('logout').addEventListener('click', handleLogout)
}

if (window.location.pathname === '/') {
  document.getElementById('login-form').addEventListener('submit', handleLogin)
}

if (window.location.pathname === '/client-profile') {
  document.getElementById('logout').addEventListener('click', handleLogout)
  const userData = JSON.parse(localStorage.getItem('userData'))
  document.getElementById('firstName').innerHTML = userData.firstName
  document.getElementById('lastName').innerHTML = userData.lastName
  document.getElementById('first').value = userData.firstName
  document.getElementById('last').value = userData.lastName

  document.getElementById('edit-profile-form').addEventListener('submit', handleEditProfile)

  document.getElementById('edit-payment-btn').onclick = function () {
    const form = document.getElementById('edit-payment-form')
    const achForm = document.getElementById('ach-details')
    if (form.style.display === 'block') {
      form.style.display = 'none'
      achForm.style.display = 'none'
    } else {
      form.style.display = 'block'
      achForm.style.display = 'block'
    }
  }
  document.getElementById('payment-method').onchange = function () {
    const achForm = document.getElementById('ach-details')
    const ccForm = document.getElementById('credit-card-details')
    if (document.getElementById('payment-method').value === 'ach') {
      achForm.style.display = 'block'
      ccForm.style.display = 'none'
    } else {
      achForm.style.display = 'none'
      ccForm.style.display = 'block'
    }
  }

  document.getElementById('edit-profile-btn').onclick = function () {
    const form = document.getElementById('edit-profile-form')
    if (form.style.display === 'block') {
      form.style.display = 'none'
    } else {
      form.style.display = 'block'
    }
  }

  document.getElementById('edit-payment-form').addEventListener('submit', async function (event) {
    event.preventDefault()
    const paymentMethod = document.getElementById('payment-method').value
    if (paymentMethod === 'ach') {
      await fetch('/payment-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod,
          routingNumber: document.getElementById('routing-number').value,
          accountNumber: document.getElementById('account-number').value,
          accountName: document.getElementById('full-name-ach').value
        })
      }).then(response => {
        if (response.status === 200) {
          response.json().then(() => {
            window.location.href = '/client-profile'
          })
        }
      })
    } else {
      await fetch('/payment-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod,
          cardNumber: document.getElementById('card-number').value,
          cardName: document.getElementById('full-name-cc').value,
          expirationDate: document.getElementById('billing-zip').value,
          securityCode: document.getElementById('security-code').value
        })
      }).then(response => {
        if (response.status === 200) {
          response.json().then(() => {
            window.location.href = '/client-profile'
          })
        }
      })
    }
  })
}

async function handleLogin (event) {
  event.preventDefault()
  console.log('here')

  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await window.crypto.subtle.digest('SHA-256', data)
  const hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password: hashedPassword
    })
  }).then(response => {
    if (response.status === 200) {
      response.json().then(data => {
        localStorage.setItem('userData', JSON.stringify(data.userData))
        window.location.href = data.redirectTo
      })
    } else if (response.status === 401) {
      document.getElementById('error-message').innerHTML = 'Invalid username or password'
    }
  })
}

async function handleCreateMeeting (event) {
  event.preventDefault()
  let type = document.getElementsByName('room-type')
  for (let i = 0; i < type.length; i++) {
    if (type[i].checked) {
      type = type[i].value
      break
    }
  }
  await fetch('/create-meeting', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organizer: localStorage.getItem('username'),
      meetingName: document.getElementById('meeting-name').value,
      meetingDate: document.getElementById('date').value,
      meetingTime: document.getElementById('time').value,
      meetingRoom: document.getElementById('room').value,
      attendees: Array.from(document.getElementById('attendees-dropdown').options) // Convert HTMLCollection to Array
        .filter(option => option.selected) // Filter only the selected options
        .map(option => option.value),
      type
    })
  }).then(response => {
    if (response.status === 200) {
      response.json().then(data => {
        localStorage.setItem('userData', JSON.stringify(data.userData))
      })
    } else if (response.status === 400) {
      response.json().then(data => {
        document.getElementById('error-message').innerHTML = data.message
      })
    }
  })
}
async function handleLogout (event) {
  event.preventDefault()

  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (response.status === 200) {
      window.location.href = '/'
    }
  })
}

async function handleRegister (event) {
  event.preventDefault()

  const encoder = new TextEncoder()
  const data = encoder.encode(document.getElementById('password').value)
  const hash = await window.crypto.subtle.digest('SHA-256', data)
  const hashedPassword = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')

  const body = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    username: document.getElementById('username').value,
    password: hashedPassword,
    type: 'client'
  }

  fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(response => {
    if (response.status === 200) {
      window.location.href = '/home'
    } else if (response.status === 401) {
      document.getElementById('error-message').innerHTML = 'Username already exists'
    }
  })
}

async function handleEditProfile (event) {
  event.preventDefault()
  const form = document.getElementById('edit-profile-form')
  await fetch('/edit-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: form.elements[0].value,
      lastName: form.elements[1].value
    })
  }).then(response => {
    if (response.status === 200) {
      response.json().then(body => {
        localStorage.setItem('userData', JSON.stringify(body.data))
        window.location.href = '/client-profile'
      })
    }
  })
}

function openModal () {
  const modal = document.getElementById('modify-attendees-modal')
  const attendeesList = document.getElementById('attendees-list')

  // Clear previous attendees
  attendeesList.innerHTML = ''

  // Populate the modal with attendees

  // Show the modal
  modal.style.display = 'block'

  // Close modal functionality
  document.getElementById('close-modal-btn').addEventListener('click', function () {
    modal.style.display = 'none'
  })
}

function populateAttendeesDropdown () {
  console.log('here')
  const attendeesDropdown = document.getElementById('attendees-dropdown')

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'))
  console.log(userData)
  if (userData && userData.users) {
    const users = userData.users

    // Add an option for each user
    users.forEach(user => {
      const option = document.createElement('option')
      option.value = user // assuming each user has an email attribute
      option.textContent = user // show name if available, otherwise show email
      attendeesDropdown.appendChild(option)
    })
  }
}

function generateMeetingTable () {
  const userData = JSON.parse(localStorage.getItem('userData'))
  const meetings = userData.meetings
  for (let i = 0; i < meetings.length; i++) {
    const meeting = meetings[i]
    const table = document.getElementById('meeting-table')
    const row = table.insertRow()
    const meetingName = row.insertCell(0)
    const meetingDate = row.insertCell(1)
    const meetingTime = row.insertCell(2)
    const meetingRoom = row.insertCell(3)
    const attendees = row.insertCell(4)
    const type = row.insertCell(5)
    const actions = row.insertCell(6)
    meetingName.innerHTML = meeting.meetingName
    meetingDate.innerHTML = meeting.meetingDate
    meetingTime.innerHTML = meeting.meetingTime
    meetingRoom.innerHTML = meeting.meetingRoom
    attendees.innerHTML = meeting.attendees
    type.innerHTML = meeting.type
    actions.innerHTML = '<button class="modify-attendees-btn">Modify Attendees</button>'
    actions.querySelector('.modify-attendees-btn').addEventListener('click', function () {
      openModal(meeting.attendees)
    })
  }
}
