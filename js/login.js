const CLIENT_ID = '749139679919-3bc57iab4hj1qv7uh6r7s9tn6lp8r389.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDwUO5PpwoNbVbWfKViTEQO8Lnpkl12D5c';
const SHEET_ID = '1jzTdEoshxRpuf9kHXI5vQLRtoCsSA-Uw-48JX8LxXaU';
const SHEET_RANGE = 'credenciales';

let token;

// Cargar Google API
gapi.load('client:auth2', initClient);

async function initClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
  });

  token = gapi.auth2.getAuthInstance().isSignedIn.get()
    ? gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
    : null;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!token) {
    await gapi.auth2.getAuthInstance().signIn();
    token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  }

  const credentials = await getCredentials();
  const user = credentials.find(row => row[0] === username && row[1] === password);

  if (user) {
    localStorage.setItem('auth', JSON.stringify({ username, token }));
    window.location.href = './page/principal.html';
  } else {
    showError('Usuario o contraseña incorrectos.');
  }
});

async function getCredentials() {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });
  return response.result.values || [];
}

function showError(message) {
  const errorMsg = document.getElementById('error-msg');
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
}
