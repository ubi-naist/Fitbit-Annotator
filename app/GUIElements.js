import { gettext } from "i18n";
import { SensorManager, DataBackupDaemon } from "./SensorManager";
import * as document from "document";

const toggleActivities = [
  "exercise", "family", "vgame", "working", "television",
  "eating", "walking",
];
const sensorManager = new SensorManager({ sensors: [] });
const backer = new DataBackupDaemon();

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

class WideToggleButton
{
  isActive = false;
  type = "";

  constructor(elem, type) {
    this.element = elem;
    this.type = type;

    this.id = elem.id;
    this.rectElem = elem.children[0].children[0];
    this.shadowElem = elem.children[0].children[1];
    this.recordIcon = elem.children[0].children[2].children[0];
    this.stopIcon = elem.children[0].children[2].children[1];
    this.textL1Elem = elem.children[0].children[3];
    this.textL2Elem = elem.children[0].children[4];

    this.setStyles(false);
    this.setEvents(type);
  }

  setStyles(isActive) {
    if (isActive) {
      this.shadowElem.style.visibility = "visible";
      this.recordIcon.style.visibility = "hidden";
      this.stopIcon.style.visibility = "visible";
      this.textL1Elem.text = gettext(`${this.type}_active_l1`);
      this.textL1Elem.style.fill = "white";
      this.textL2Elem.text = gettext(`${this.type}_active_l2`);
      this.textL2Elem.style.fill = "white";
    } else {
      this.shadowElem.style.visibility = "hidden";
      this.recordIcon.style.visibility = "visible";
      this.stopIcon.style.visibility = "hidden";
      this.textL1Elem.text = gettext(`${this.type}_inactive_l1`);
      this.textL1Elem.style.fill = "black";
      this.textL2Elem.text = gettext(`${this.type}_inactive_l2`);
      this.textL2Elem.style.fill = "black";
    }
  }

  toggle() {
    this.isActive = !this.isActive;
    this.setStyles(this.isActive);
  }

  setEvents(type) {
    let rectEvent = undefined;
    switch(type) {
      case "record":
        const deactivateToggle = () => {
          if (this.isActive) {
            this.toggle();
          }
        };
        sensorManager.onNonStart = () => deactivateToggle();
        sensorManager.onAllSensorsStopped = () => deactivateToggle();
        sensorManager.onNotEnoughEnergy = () => {
          const alert = new AlertNotification("alert");
          alert.alertWithTimer("low_battery_alert");
        };
        sensorManager.onWatchdogEvent = () => {
          backer.deleteBackedupFiles();
        };
        rectEvent = (_) => {
          this.toggle();
          if (this.isActive) {
            sensorManager.enableSensor("heartrate");
            sensorManager.start();
            backer.backupToCompanion(true);
            backer.start();
            console.log(`Sensor logger activated`);
          } else {
            sensorManager.stop();
            backer.stop();
            backer.backupToCompanion(true);
            console.log(`Sensor logger deactivated`);
          }
        };
        break;
      default:
        rectEvent = (_) => {
          this.toggle();
          console.log(`Toggle ${this.type} pressed, Active? ${this.isActive}`);
        };
        break;
    }
    this.rectElem.addEventListener('mousedown', rectEvent);
  }
}

class AlertNotification
{
  isActive = false;
  message = "";
  elem = null;
  elemText = null;

  constructor(elemID, msg = "") {
    this.message = msg;
    this.elemID = elemID;
    this.elem = document.getElementById(elemID);
    this.textElem = this.elem.getElementById("text");
    this.isActive = this.isElementActive();
    this.setText(this.message);
  }

  isElementActive = () => this.elem.style.visibility != "hidden";

  setText(msg) {
    this.message = msg;
    this.textElem.text = this.message;
  }

  show(show) {
    if (show) {
      this.isActive = true;
      this.elem.style.visibility = "visible";
    } else {
      this.isActive = false;
      this.elem.style.visibility = "hidden";
    }
  }

  toggle() {
    this.show(!this.isActive);
  }

  alertWithTimer(i18nMSG, mstimeout = 4000) {
    const message = gettext(i18nMSG);
    if (this.isActive) {
      // Hide old message and change text
      this.toggle();
      this.setText(message);
    }
    this.show(true);
    setTimeout(() => {
      this.show(false);
    }, mstimeout);
  }
}

export {
  ActivityButton, toggleActivities,
  WideToggleButton,
  AlertNotification };
