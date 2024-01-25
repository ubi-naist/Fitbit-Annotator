import * as document from "document";
import { gettext } from "i18n";

class ActivityButton
{
  isActive = false;

  constructor(elem, {isToggle} = {}) {
    this.element = elem;
    this.isToggle = isToggle || false;

    this.id = elem.id;
    this.activityName = elem.id.split("-")[0];
    this.circleElem = elem.children[0].children[0];
    this.shadowElem = elem.children[0].children[1];
    this.imageElem = elem.children[0].children[2];
    this.textElem = elem.children[0].children[3];

    // I wasn't able to modify href or other attributes from use/set tags by any CSS means
    // I had to reimplement the full button behavior and template structure >__< WHYY!!
    // It might be simplified in the future when the SVG Template+CSS selectors impl is more complete
    this.setAttributes();
    this.setStyles(false);
    this.setEvents();
  }

  setAttributes() {
    this.imageElem.href = `/mnt/assets/resources/icons/${this.activityName}.png`;
    this.textElem.text = gettext(`${this.activityName}_icon`);
    if (!this.isToggle) {
      this.circleElem.class = "secondary";
    }
  }

  setStyles(isActive) {
    if (isActive) {
      this.shadowElem.style.visibility = "visible";
      this.imageElem.style.fill = "white";
      this.textElem.style.fill = "white";
    } else {
      this.shadowElem.style.visibility = "hidden";
      this.imageElem.style.fill = "black";
      this.textElem.style.fill = "black";
    }
  }

  toggle() {
    this.isActive = !this.isActive;
    this.setStyles(this.isActive);
  }

  setEvents() {
    this.circleElem.addEventListener('mousedown', (_) => {
      if (this.isToggle) {
        this.toggle();
      } else {
        this.setStyles(true);
      }
      console.log(`${this.activityName} pressed, Toggled? ${this.isActive}`);
    });
    this.circleElem.addEventListener('mouseup', (_) => {
      if (!this.isToggle) {
        this.setStyles(false);
      }
    });
  }
}
var buttons = {};

let templates = document.getElementsByClassName("actbutton-section");
templates.forEach((section) => {
  const button = section.parent;
  const activityName = button.id.split("-")[0];
  switch (activityName) {
    case 'eating':
    case 'working':
    case 'vgame':
    case 'walking':
    case 'exercise':
    case 'television':
      buttons[activityName] = new ActivityButton(button, {isToggle: true,});
      break;
    default:
      buttons[activityName] = new ActivityButton(button);
      break;
  };
});

/*
  Buttons to include:
  emoji_u1f3cb  Exercise
  emoji_u1f46a  Being with others
  emoji_u1f389  Party
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