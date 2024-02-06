import * as document from "document";
import { ActivityButton, WideToggleButton, toggleActivities } from "./GUIElements.js";

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
