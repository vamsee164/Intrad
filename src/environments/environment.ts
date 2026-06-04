export const environment = {
  production: false,
  weatherApiKey: '93e63dcc1fb38ed986a59514d85dbbd1',
  // ─── Set false = real Firebase SMS (needs reCAPTCHA Enterprise enabled in GCP) ───
  // ─── Set true  = local emulator (no real SMS, for development only)            ───
  useAuthEmulator: false,
  authEmulatorUrl: 'http://127.0.0.1:9099',
  firebase: {
    apiKey: "AIzaSyCd-RUeA1CfEdM2B5eG7Romgpnn6IrjZC8",
    authDomain: "intra-d.firebaseapp.com",
    projectId: "intra-d",
    storageBucket: "intra-d.firebasestorage.app",
    messagingSenderId: "980080045216",
    appId: "1:980080045216:web:ba32317a47dbb7b577edc5",
    measurementId: "G-NRLP7Y96BF",
    databaseURL: 'https://intra-d-default-rtdb.asia-southeast1.firebasedatabase.app'
  }
};

