import { batt } from "power";
import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
import { HearRateSensor } from "heart-rate";

class Sensor {
  type = null;
  device = null;
  freq = 5; // hertz
  batch = 150; // samples to get batched per triggered event
  zeroPadding = 3;
  availableSensors = new Map([
    ["accelerometer", Accelerometer],
    ["gyroscope", Gyroscope],
    ["heartrate", HearRateSensor],
  ]);

  constructor(type, freq, batch) {
    this.freq = freq || this.freq;
    this.batch = batch || this.batch;
    type = type.toLowerCase().trim();

    if (this.availableSensors.has(type)) {
      throw new TypeError(`"${type}" sensor is not implemented`);
    }
    const constructor = this.availableSensors.get(type);
    this.device = new constructor({
      frequency: this.freq,
      batch: this.batch,
    });
    this.device.addEventListener("reading", this[type + "Event"]);
  }

  get isActive() {
    return this.device.activated;
  }

  start = () => this.device.start();

  accelerometerEvent() {
    const r = this.device.readings;
    console.log("Accelerometer records:");
    for (let i = 0; i < r.timestamp.length; i++) {
      console.log(
        `${this._zeropad(i)} ${r.timestamp[i]}: ${r.x[i]},${r.y[i]},${r.z[i]}`
      );
    }
  }

  gyroscopeEvent() {
    const r = this.device.readings;
    console.log("Gyroscope records:");
    for (let i = 0; i < r.timestamp.length; i++) {
      console.log(
        `${this._zeropad(i)} ${r.timestamp[i]}: ${r.x[i]},${r.y[i]},${r.z[i]}`
      );
    }
  }

  heartrateEvent() {
    const r = this.device.readings;
    console.log("HeartRate records:");
    for (let i = 0; i < r.timestamp.length; i++) {
      console.log(`${this._zeropad(i)} ${r.timestamp[i]}: ${r.heartRate[i]}`);
    }
  }

  _zeropad = (num) => ("0000000" + num).slice(-this.zeroPadding);
}

class SensorLogger {
  freq = 5; // hertz
  batch = 150; // samples to get batched per triggered event
  minBatteryLevel = 20;
  watchdogTimeLimit = 1 * 60 * 1000; // milliseconds
  watchdogTimer = null;
  sensors = [];

  constructor({ freq, batch, sensors } = {}) {
    this.freq = freq || this.freq;
    this.batch = batch || this.batch;
    sensors.forEach((type) => {
      this.sensors.append(type, this.freq, this.batch);
    });
  }

  get notEnoughEnergy() {
    return batt.chargeLevel <= this.minBatteryLevel && !batt.charging;
  }

  enableSensor(type, freq = null, batch = null) {
    type = type.toLowerCase().trim();
    freq = freq || this.freq;
    batch = batch || this.batch;

    if (this.notEnoughEnergy) {
      console.warn(
        "SensorLogger not started, battery low: " + batt.chargeLevel
      );
      return;
    }

    let add = false;
    this.sensors.forEach((sensor) => {
      if (sensor.type == type) {
        add = true;
      }
    });
    if (add) {
      this.sensors.append(type, freq, batch);
    }
  }

  disableSensor(type) {
    type = type.toLowerCase().trim();
    let indexToRemove = null;
    for(let i = 0; i < this.sensors.length; i++) {
        if (this.sensors[i].type == type) {
            indexToRemove = i;
            break;
        }
    }
    if (indexToRemove !== null) {
        this.sensors[indexToRemove].stop();
        this.sensors.splice(indexToRemove, 1);
    }
  }

  start(sensors = []) {
    if (this.notEnoughEnergy) {
      console.warn(
        "SensorLogger not started, battery low: " + batt.chargeLevel
      );
      return;
    }
    this.sensors.forEach((sensor) => {
      if (sensors.length > 0 && sensors.indexOf(sensor.type) === -1) {
        // this sensor is not in the list parameter <sensors>
        return;
      }
      sensor.start();
    });
  }

  stop(sensors = []) {
    this.sensors.forEach((sensor) => {
      if (sensors.length > 0 && sensors.indexOf(sensor.type) === -1) {
        // this sensor is not in the list parameter <sensors>
        return;
      }
      sensor.stop();
    });
  }

  // Stops SensorLogger in case battery is less than <this.minBatteryLevel>
  // runs every <this.watchdogTimeLimit>
  watchdogHandle() {
    console.debug(`Watchdog, enough batt? ${!this.notEnoughEnergy}`);
    if (this.notEnoughEnergy) {
      this.stop();
    }
    this.startWatchdog();
  }

  startWatchdog() {
    this.watchdogTimer = setTimeout(
      this.watchdogHandle,
      this.watchdogTimeLimit
    );
  }

  stopWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
  }
}

export { Sensor, SensorLogger };