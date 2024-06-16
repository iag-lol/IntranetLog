const CLIENT_ID = '185859829591-k1bspc3ksrha9pe2o7lmh5gv8q987a2m.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCyVG9n1lH7sfiSF2ABW6q5Q00xLVkXDgI';
const SPREADSHEET_ID = '1ZMAIPcRS2hPV4pojfXWZflPQfIrOBehRvPoreotvlAI';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', function() {
    gapi.load('client', initializeGapiClient);
    window.onload = () => {
        if (!isAuthenticated) {
            gisLoaded();
        }
    };
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
    if (gapiInited && gisInited && !isAuthenticated) {
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
            isAuthenticated = true;
            document.getElementById('sheet-status').textContent = 'CONECTADO';
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
        isAuthenticated = true;
        document.getElementById('sheet-status').textContent = 'CONECTADO';
    };
    tokenClient.requestAccessToken();
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!isAuthenticated) {
        requestAccessToken();
        return;
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!A2:B',
        });
        const data = response.result.values;
        const user = data.find(row => row[0] === username && row[1] === password);

        if (user) {
            showAlert('Inicio de sesión exitoso', false);
            setTimeout(() => {
                window.location.href = 'principal.html';
            }, 2000);
        } else {
            showAlert('Usuario o contraseña incorrectos', true);
        }
    } catch (error) {
        console.error('Error fetching credentials:', error);
        showAlert('Error al verificar las credenciales', true);
    }
}

function showAlert(message, isError = false) {
    const alertBox = document.getElementById('alert');
    alertBox.textContent = message;
    alertBox.className = isError ? 'alert error show' : 'alert success show';
    setTimeout(() => {
        alertBox.className = 'alert';
    }, 3000);
}

// Funciones para manejo de modal
function showForgotPassword() {
    document.getElementById('forgot-password-form').style.display = 'block';
}

function closeForgotPassword() {
    document.getElementById('forgot-password-form').style.display = 'none';
}

function showCreateAccount() {
    document.getElementById('create-account-form').style.display = 'block';
}

function closeCreateAccount() {
    document.getElementById('create-account-form').style.display = 'none';
}

async function handleForgotPassword() {
    // Lógica para manejar olvido de contraseña
}

async function handleCreateAccount() {
    // Lógica para manejar creación de cuenta
}

document.addEventListener('DOMContentLoaded', (event) => {
    gapiLoaded();
    gisLoaded();
});

