const CLIENT_ID = '185859829591-esem7nmdnnctnp3c9072c7ii3brssoa1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBDLRSUqxX-qchAUcZYsRTO2WOzwbgVxP0';
const SPREADSHEET_ID = '1ZMAIPcRS2hPV4pojfXWZflPQfIrOBehRvPoreotvlAI';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.addEventListener('DOMContentLoaded', function() {
    gapi.load('client', initializeGapiClient);
    gapi.load('auth2', gisLoaded);
});

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
        showAlert('Error initializing GAPI client', true);
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: '', // definido más tarde
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        const token = localStorage.getItem('google_api_token');
        if (token) {
            gapi.client.setToken({ access_token: token });
            validateToken();
        } else {
            requestAccessToken();
        }
    }
}

async function validateToken() {
    try {
        const tokenInfo = await gapi.client.oauth2.tokeninfo({ access_token: gapi.client.getToken().access_token });
        if (tokenInfo.error) {
            requestAccessToken();
        } else {
            await fetchData();
        }
    } catch (error) {
        requestAccessToken();
        console.error('Error validating token:', error);
    }
}

function requestAccessToken() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error during token callback:', resp);
            showAlert('Error during token callback', true);
            throw (resp);
        }
        localStorage.setItem('google_api_token', resp.access_token);
        gapi.client.setToken({ access_token: resp.access_token });
        await fetchData();
    };
    tokenClient.requestAccessToken();
}

async function fetchData() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!A2:B',
        });
        const data = response.result.values;
        console.log('Data from Google Sheets:', data);

        const statusResponse = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!E1',
        });
        document.getElementById('sheet-status').textContent = statusResponse.result.values[0][0];
        document.getElementById('sheet-status').classList.add('success');
    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Error fetching data: ' + error.message, true);
    }
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showAlert('Por favor, complete todos los campos.', true);
        return;
    }

    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'credenciales!A2:B',
    }).then(response => {
        const rows = response.result.values;
        const user = rows.find(row => row[0] === username && row[1] === password);

        if (user) {
            showAlert('Acceso concedido. Redirigiendo...', false);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showAlert('Usuario o contraseña incorrectos.', true);
        }
    }).catch(error => {
        console.error('Error fetching credentials:', error);
        showAlert('Error al verificar las credenciales.', true);
    });
}

function showForgotPassword() {
    document.getElementById('forgot-password-form').style.display = 'block';
}

function showCreateAccount() {
    document.getElementById('create-account-form').style.display = 'block';
}

function closeForgotPassword() {
    document.getElementById('forgot-password-form').style.display = 'none';
}

function closeCreateAccount() {
    document.getElementById('create-account-form').style.display = 'none';
}

function showAlert(message, isError = false) {
    const alertBox = document.getElementById('alert');
    alertBox.textContent = message;
    alertBox.className = isError ? 'alert error show' : 'alert success show';
    setTimeout(() => {
        alertBox.className = 'alert';
    }, 3000);
}

async function handleForgotPassword() {
    const username = document.getElementById('fp-username').value;
    const email = document.getElementById('fp-email').value;

    if (!username || !email) {
        showAlert('Por favor, complete todos los campos.', true);
        return;
    }

    closeForgotPassword();
    showAlert('Se ha enviado un correo de recuperación de contraseña.', false);
}

async function handleCreateAccount() {
    const newUsername = document.getElementById('ca-username').value;
    const newPassword = document.getElementById('ca-password').value;
    const confirmPassword = document.getElementById('ca-confirm-password').value;

    if (!newUsername || !newPassword || !confirmPassword) {
        showAlert('Por favor, complete todos los campos.', true);
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden.', true);
        return;
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!A:B',
            valueInputOption: 'RAW',
            resource: {
                values: [[newUsername, newPassword]]
            }
        });

        if (response.status === 200) {
            showAlert('Cuenta creada exitosamente.', false);
            closeCreateAccount();
        } else {
            showAlert('Error al crear la cuenta.', true);
        }
    } catch (error) {
        console.error('Error creating account:', error);
        showAlert('Error al crear la cuenta.', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    gapiLoaded();
    gisLoaded();
});
