const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const data = require('../database/data.json')

const app = express()

app.use(express.json(), cookieParser())
app.use(express.static(path.join(__dirname, '../app')))
app.use(express.static(path.join(__dirname, '../database')))

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../app/pages/login.html')))
app.post('/login', (req, res) => handleLoginRequest(req, res))
app.post('/register', (req, res) => handleRegisterRequest(req, res))
app.post('/logout', (req, res) => res.clearCookie('session').json({ message: 'Logout successful' }))
app.post('/payment-information', (req, res) => handleEditPaymentInformationRequest(req, res))
app.post('/create-meeting', (req, res) => handlePostCreateMeetingRequest(req, res))
app.post('/remove-room', (req, res) => handlePostRemoveRoomRequest(req, res))
app.post('/file-complaint', (req, res) => handlePostFileComplaintRequest(req, res))
app.post('/create-room', (req, res) => handlePostRoomRequest(req, res))
app.post('/edit-profile', (req, res) => handleEditProfileRequest(req, res))
app.post('/respond-to-complaint', (req, res) => handlePostComplaintResponse(req, res))
app.post('/remove-meeting', (req, res) => handlePostRemoveMeetingRequest(req, res))
app.get('/client-home', (req, res) => handleClientHomeRequest(req, res))
app.get('/admin-home', (req, res) => handleAdminHomeRequest(req, res))
app.get('/client-profile', (req, res) => handleClientProfileRequest(req, res))
app.get('/create-meeting', (req, res) => handleCreateMeetingRequest(req, res))
app.get('/file-complaint', (req, res) => handleFileComplaintRequest(req, res))
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../app/pages/registration.html')))
app.get('/edit-rooms', (req, res) => handleEditRoomsRequest(req, res))
app.get('/view-complaints', (req, res) => handleViewComplaintsRequest(req, res))
app.get('/admin-view-meetings', (req, res) => handleAdminViewMeetingsRequest(req, res))

app.listen(3000, () => console.log('Server is Running'))

function handleLoginRequest (req, res) {
  const { username, password: hashedPassword } = req.body
  const users = data.users

  if (users[username] && users[username].password === hashedPassword) {
    const sessionId = uuidv4()

    // Remove all previous sessions for the user
    for (const session in data.sessions) {
      if (data.sessions[session].username === username) {
        delete data.sessions[session]
      }
    }

    if (!data.hasOwnProperty('sessions')) {
      data.sessions = {}
    }
    // Add a new session to the data
    data.sessions[sessionId] = { username, expires: Date.now() + 3600000 }

    // Write the updated data back to the JSON file
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(data), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })

    // Set the session ID as a cookie
    res.cookie('sessionId', sessionId, { maxAge: 3600000, httpOnly: true })
    let userData
    if (users[username].type === 'client') {
      userData = getDataForUser(username)
    } else {
      userData = getAdminDataForUser(username)
    }
    res.json({ redirectTo: users[username].type === 'client' ? '/client-home' : '/admin-home', userData })
  } else {
    res.status(401).json({ message: 'Invalid username or password' })
  }
}

function handleRegisterRequest (req, res) {
  const username = req.body.username
  const hashedPassword = req.body.password
  const firstName = req.body.firstName
  const lastName = req.body.lastName
  const type = req.body.type
  const users = data.users
  if (users[username]) {
    res.status(401).json({ message: 'Username already exists' })
  } else {
    const newData = data
    const sessionId = uuidv4()
    newData.users[username] = {
      username,
      password: hashedPassword,
      firstName,
      lastName,
      type
    }
    newData.sessions[sessionId] = {
      username
    }
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.cookie('sessionId', sessionId, { maxAge: 3600000, httpOnly: true })
    res.json({ firstName, lastName, type, meetings: [], attendee: [], complaints: [] })
  }
}

function handleClientHomeRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    res.sendFile(path.join(__dirname, '../app/pages/client-home.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handleAdminHomeRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    res.sendFile(path.join(__dirname, '../app/pages/admin-home.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handleClientProfileRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    res.sendFile(path.join(__dirname, '../app/pages/client-profile.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handleCreateMeetingRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    res.sendFile(path.join(__dirname, '../app/pages/create-meeting.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handlePostCreateMeetingRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    const newData = data
    const username = newData.sessions[req.cookies.sessionId].username
    const meetingData = req.body
    if (checkIfRoomIsAvailable(meetingData.meetingRoom, meetingData.meetingTime, meetingData.meetingDate)) {
      if (checkIfAttendeesAreAvailable(meetingData.attendees, meetingData.meetingTime, meetingData.meetingDate)) {
        if (checkIfOrganizerIsAvailable(username, meetingData.meetingTime, meetingData.meetingDate)) {
          meetingData.organizer = username
          meetingData.id = uuidv4()
          newData.meetings.push(meetingData)
          fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
            if (err) {
              return res.status(500).json({ message: 'Error updating session information' })
            }
          })
          res.statusCode = 200
          res.json({ userData: getDataForUser(username) })
        } else {
          res.statusCode = 400
          res.json({ message: 'You are not available at that time' })
        }
      } else {
        res.statusCode = 400
        res.json({ message: 'One or more attendees are not available at that time' })
      }
    } else {
      res.statusCode = 400
      res.json({ message: 'The room is not available at that time' })
    }
  }
}

app.get('/meeting/:id', function (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    res.sendFile(path.join(__dirname, '../app/pages/meeting-detail.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
})

function handleFileComplaintRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    res.sendFile(path.join(__dirname, '../app/pages/file-complaint.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handleEditPaymentInformationRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    const user = data.sessions[req.cookies.sessionId].username
    const newData = data
    newData.users[user].paymentInformation = req.body
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    let userData
    if (data.users[user].type === 'client') {
      userData = getDataForUser(user)
    } else {
      userData = getAdminDataForUser(user)
    }
    res.json({ userData: userData })
  }
}

function checkSession (sessionId) {
  return !!(sessionId && data.sessions[sessionId] && data.sessions[sessionId].expires > Date.now())
}

function checkPermission (sessionId, permission) {
  if (checkSession(sessionId)) {
    const username = data.sessions[sessionId].username
    if (data.users[username].type === permission) {
      return true
    }
  }
  return false
}

function handleEditProfileRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    const user = data.sessions[req.cookies.sessionId].username
    const newData = data
    newData.users[user].firstName = req.body.firstName
    newData.users[user].lastName = req.body.lastName
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    res.json({ data: getDataForUser(user) })
  }
}

function getDataForUser (username) {
  return {
    firstName: data.users[username].firstName,
    lastName: data.users[username].lastName,
    paymentInformation: obscurePaymentInformation(username),
    type: data.users[username].type,
    rooms: data.rooms,
    meetings: data.meetings.filter(meeting => meeting.organizer === username),
    attendee: data.meetings.filter(meeting => meeting.attendees.includes(username)),
    complaints: data.complaints.filter(complaint => complaint.user === username),
    users: Object.keys(data.users).filter(user => data.users[user].type === 'client' && user !== username)
  }
}

function obscurePaymentInformation (username) {
  const paymentInformation = data.users[username].paymentInformation
  const obscuredResult = {}
  if (paymentInformation.paymentMethod === 'credit-card') {
    obscuredResult.paymentMethod = 'credit-card'
    obscuredResult.cardName = paymentInformation.cardName
    obscuredResult.cardNumber = '**** **** **** ' + paymentInformation.cardNumber.slice(-4)
    obscuredResult.expirationDate = paymentInformation.expirationDate
    obscuredResult.securityCode = '***'
  } else if (paymentInformation.paymentMethod === 'ach') {
    obscuredResult.paymentMethod = 'ach'
    obscuredResult.accountName = paymentInformation.accountName
    obscuredResult.routingNumber = '****' + paymentInformation.routingNumber.slice(-4)
    obscuredResult.accountNumber = '****' + paymentInformation.accountNumber.slice(-4)
  }
  return obscuredResult
}

function checkIfRoomIsAvailable (room, time, date) {
  const meetings = data.meetings
  for (let i = 0; i < meetings.length; i++) {
    if (meetings[i].meetingRoom === room && meetings[i].meetingTime === time && meetings[i].meetingDate === date) {
      return false
    }
  }
  return true
}

function handlePostFileComplaintRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'client')) {
    const newData = data
    const username = newData.sessions[req.cookies.sessionId].username
    const complaintData = req.body
    complaintData.user = username
    complaintData.id = uuidv4()
    newData.complaints.push(complaintData)
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    res.json({ userData: getDataForUser(username) })
  }
}

function handleEditRoomsRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    res.sendFile(path.join(__dirname, '../app/pages/edit-rooms.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handlePostRoomRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    const newData = data
    const roomData = req.body
    roomData.id = uuidv4()
    newData.rooms.push(roomData)
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    res.json({ userData: getDataForUser(newData.sessions[req.cookies.sessionId].username) })
  }
}

function handlePostRemoveRoomRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    const newData = data
    const roomName = req.body.name
    newData.rooms = newData.rooms.filter(room => room.name !== roomName)
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    res.json({ userData: getDataForUser(newData.sessions[req.cookies.sessionId].username) })
  }
}

function checkIfOrganizerIsAvailable (organizer, time, date) {
  const meetings = data.meetings
  for (let i = 0; i < meetings.length; i++) {
    if (meetings[i].organizer === organizer && meetings[i].meetingTime === time && meetings[i].meetingDate === date) {
      return false
    }
  }
  return true
}

function checkIfAttendeesAreAvailable (attendees, time, date) {
  const meetings = data.meetings
  for (let i = 0; i < meetings.length; i++) {
    for (let j = 0; j < attendees.length; j++) {
      if (meetings[i].attendees.includes(attendees[j]) && meetings[i].meetingTime === time && meetings[i].meetingDate === date) {
        return false
      }
      if (meetings[i].organizer === attendees[j] && meetings[i].meetingTime === time && meetings[i].meetingDate === date) {
        return false
      }
    }
  }
  return true
}

function handleViewComplaintsRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    res.sendFile(path.join(__dirname, '../app/pages/view-complaints.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handlePostComplaintResponse (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    const newData = data
    const complaintId = req.body.id
    const response = req.body.response
    newData.complaints = newData.complaints.map(complaint => {
      if (complaint.id === complaintId) {
        complaint.response = response
        complaint.status = 'resolved'
      }
      return complaint
    })
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    res.json({ userData: getDataForUser(newData.sessions[req.cookies.sessionId].username) })
  }
}

function handleAdminViewMeetingsRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    res.sendFile(path.join(__dirname, '../app/pages/admin-view-meetings.html'))
  } else {
    res.sendFile(path.join(__dirname, '../app/pages/unauthorized.html'))
  }
}

function handlePostRemoveMeetingRequest (req, res) {
  if (checkSession(req.cookies.sessionId) && checkPermission(req.cookies.sessionId, 'admin')) {
    const newData = data
    const meetingId = req.body.id
    newData.meetings = newData.meetings.filter(meeting => meeting.id !== meetingId)
    fs.writeFile(path.join(__dirname, '../database/data.json'), JSON.stringify(newData), function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating session information' })
      }
    })
    res.statusCode = 200
    res.json({ userData: getDataForUser(newData.sessions[req.cookies.sessionId].username) })
  }
}

function getAdminDataForUser(username) {
  const userData = getDataForUser(username)
  userData.complaints = data.complaints
  userData.meetings = data.meetings
  return userData
}
