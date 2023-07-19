document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();

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
      window.location.href = '/home';
    } else {
      document.getElementById('error-message').innerText = 'Invalid username or password';
    }
  })
});
