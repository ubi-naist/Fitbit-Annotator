/*
  Responsible for loading, applying and saving settings.
  Requires companion/simple/companion-settings.js
  Callback should be used to update your UI.
  https://github.com/Fitbit/sdk-moment/blob/master/app/index.js
*/
import { me } from "appbit";
import * as fs from "fs";
import * as messaging from "messaging";

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

let settings, onsettingschange;
const defaults = {
  apiurl: { name: "" },
  fupendpoint: { name: "" },
  logheartrate: false,
  logaccelerometer: false,
  loggyroscope: false,
};

export function initialize(callback) {
  settings = loadSettings();
  console.log(`Settings in file: ${JSON.stringify(settings)}`);
  settings = {
    ...defaults,
    ...settings,
  };
  console.log(`Settings loaded: ${JSON.stringify(settings)}`);
  onsettingschange = callback;
  onsettingschange(settings);
}

// Received message containing settings data
messaging.peerSocket.addEventListener("message", function (evt) {
  settings[evt.data.key] = evt.data.value;
  onsettingschange(settings);
});

// Register for the unload event
me.addEventListener("unload", saveSettings);

// Load settings from filesystem
function loadSettings() {
  try {
    return fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    return {};
  }
}

// Save settings to the filesystem
function saveSettings() {
  console.log(`Settings saving into file: ${JSON.stringify(settings)}`);
  fs.writeFileSync(SETTINGS_FILE, settings, SETTINGS_TYPE);
}
