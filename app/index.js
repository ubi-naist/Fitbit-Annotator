import * as document from "document";
import { ActivityButton, WideToggleButton, toggleActivities } from "./GUIElements.js";
import * as simpleSettings from "./device-settings.js";

var activityButtons = {};
let templates = document.getElementsByClassName("actbutton-section");
templates.forEach(section => {
  const button = section.parent;
  const activityName = button.id.split("-")[0];
  const togglable = toggleActivities.indexOf(activityName) !== -1;
  activityButtons[activityName] = new ActivityButton(
    button, {isToggle: togglable}
  );
});

var toggleButtons = {};
templates = document.getElementsByClassName("toggbutton-section");
templates.forEach(section => {
  const button = section.parent;
  const toggleName = button.id.split("-")[0];
  toggleButtons[toggleName] = new WideToggleButton(
    button, toggleName
  );
});

/* -------- SETTINGS -------- */
function settingsCallback(data) {
  if (!data) {
    return;
  }
  if (data.logheartrate) {
    toggleButtons["record"].logHeartrate = data.logheartrate;
  }
  if (data.logaccelerometer) {
    toggleButtons["record"].logAccelerometer = data.logaccelerometer;
  }
  if (data.loggyroscope) {
    toggleButtons["record"].logGyroscope = data.loggyroscope;
  }
}
simpleSettings.initialize(settingsCallback);