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

/*
  Buttons to include:
  emoji_u1f3cb  Exercise
  emoji_u1f46a  Being with others
  emoji_u1f3ae  Playing vgames
  emoji_u1f3e2  Working
  emoji_u1f4fa  Watching a show
  emoji_u1f622  Crying
  emoji_u1f923  Having fun
  emoji_u1f623  Anxious
  emoji_u1f973  Aroused emotion
  emoji_u1f37d  Eating
  emoji_u1f6b6  Going out (walking)
  emoji_u1f486  Relaxing
*/