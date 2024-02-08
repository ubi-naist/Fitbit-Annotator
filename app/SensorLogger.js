import { battery as batt } from "power";
import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
import { HeartRateSensor } from "heart-rate";

class Sensor {
  type = null;
  device = null;
  freq = 5; // hertz
  batch = 150; // samples to get batched per triggered event
  zeroPadding = 3;
  static availableSensors = {
    accelerometer: "accelerometerBuilder",
    gyroscope: "gyroscopeBuilder",
    heartrate: "heartrateBuilder",
  };

  constructor(type, freq, batch) {
    this.freq = freq || this.freq;
    this.batch = batch || this.batch;
    this.type = type.toLowerCase().trim();

    if (Object.keys(Sensor.availableSensors).indexOf(this.type) === -1) {
      throw new TypeError(`"${this.type}" sensor is not implemented`);
    }
    const builder = Sensor.availableSensors[this.type];
    this.device = this[builder]();
  }

  get isActive() {
    return this.device.activated;
  }

  start() {
    this.device.start();
    console.log(`${this.type} sensor started`);
  }
  stop() {
    this.device.stop();
    console.log(`${this.type} sensor stopped`);
  }

  accelerometerBuilder() {
    const device = new Accelerometer({
      frequency: this.freq,
      batch: this.batch,
    });
    device.addEventListener("reading", () => {
      const r = device.readings;
      console.log("Accelerometer records:");
      for (let i = 0; i < r.timestamp.length; i++) {
        console.log(
          `${this._zeropad(i)} ${r.timestamp[i]}: ${r.x[i]},${r.y[i]},${r.z[i]}`
        );
      }
    });
    console.log(`Accelerometer sensor initialized`);
    return device;
  }

  gyroscopeBuilder() {
    const device = new Gyroscope({
      frequency: this.freq,
      batch: this.batch,
    });
    device.addEventListener("reading", () => {
      const r = device.readings;
      console.log("Gyroscope records:");
      for (let i = 0; i < r.timestamp.length; i++) {
        console.log(
          `${this._zeropad(i)} ${r.timestamp[i]}: ${r.x[i]},${r.y[i]},${r.z[i]}`
        );
      }
    });
    console.log(`Gyroscope sensor initialized`);
    return device;
  }

  heartrateBuilder() {
    const device = new HeartRateSensor({
      frequency: this.freq,
      batch: this.batch,
    });
    device.addEventListener("reading", () => {
      const r = device.readings;
      console.log("HeartRateSensor records:");
      for (let i = 0; i < r.timestamp.length; i++) {
        console.log(`${this._zeropad(i)} ${r.timestamp[i]}: ${r.heartRate[i]}`);
      }
    });
    console.log(`HeartRateSensor sensor initialized`);
    return device;
  }

  _zeropad = (num) => ("0000000" + num).slice(-this.zeroPadding);
}

class SensorLogger {
  freq = 5; // hertz
  batch = 150; // samples to get batched per triggered event
  minBatteryLevel = 20;
  watchdogTimeLimit = 1 * 60 * 1000; // milliseconds
  watchdogTimer = null;

  constructor({ freq, batch, sensors } = {}) {
    this.freq = freq || this.freq;
    this.batch = batch || this.batch;
    this.sensors = [];

    const isIterable = sensors && typeof sensors.forEach === "function";
    if (isIterable) {
      sensors.forEach((type) => {
        this.sensors.push(new Sensor(type, this.freq, this.batch));
      });
    } else {
      // Load all available sensors
      Object.keys(Sensor.availableSensors).forEach((type) => {
        this.sensors.push(new Sensor(type, this.freq, this.batch));
      });
    }
  }

  get notEnoughEnergy() {
    return batt.chargeLevel <= this.minBatteryLevel && !batt.charging;
  }

  enableSensor(type, freq = null, batch = null) {
    type = type.toLowerCase().trim();
    freq = freq || this.freq;
    batch = batch || this.batch;

    if (this.sensors.some((sensor) => sensor.type == type)) {
      console.log(`Sensor ${type} already enabled`);
      return;
    }

    if (this.notEnoughEnergy) {
      console.warn(
        "SensorLogger not started, battery low: " + batt.chargeLevel
      );
      return;
    }

    if (Object.keys(Sensor.availableSensors).indexOf(type) !== -1) {
      this.sensors.push(new Sensor(type, freq, batch));
    } else {
      console.error(`Sensor "${type}" is not implemented, cannot be enabled.`);
    }
  }

  disableSensor(type) {
    type = type.toLowerCase().trim();
    let indexToRemove = null;
    for (let i = 0; i < this.sensors.length; i++) {
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

    let activeSensors = Array(this.sensors.length);
    for (let i = 0; i < this.sensors.length; i++) {
      let curSensor = this.sensors[i];
      if (sensors.length < 1 || sensors.indexOf(curSensor.type) !== -1) {
        // It should start current sensor if 1. <sensors> is not defined 2. the sensor was defined in <sensors>
        curSensor.start();
      } // it won't start the sensor if <sensors> is defined AND this sensor is not defined in <sensors>
      activeSensors[i] = curSensor.isActive;
    }
    if (activeSensors.some((elem) => elem === true)) {
      this.startWatchdog();
    }
  }

  stop(sensors = []) {
    let activeSensors = Array(this.sensors.length);
    for (let i = 0; i < this.sensors.length; i++) {
      let curSensor = this.sensors[i];
      if (sensors.length < 1 || sensors.indexOf(curSensor.type) !== -1) {
        // It should stop current sensor if 1. <sensors> is not defined 2. the sensor was defined in <sensors>
        curSensor.stop();
      } // it won't stop the sensor if <sensors> is defined AND this sensor is not defined in <sensors>
      activeSensors[i] = curSensor.isActive;
    }
    if (activeSensors.every((elem) => elem === false)) {
      this.stopWatchdog();
    }
  }

  // Stops SensorLogger in case battery is less than <this.minBatteryLevel>
  // runs every <this.watchdogTimeLimit>
  watchdogHandle() {
    console.log(`Watchdog, enough batt? ${!this.notEnoughEnergy}`);
    if (this.notEnoughEnergy) {
      this.stop();
    }
    this.watchdogTimer = undefined;
    this.startWatchdog();
  }

  startWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    this.watchdogTimer = setTimeout(
      this.watchdogHandle,
      this.watchdogTimeLimit
    );
    console.log(`Watchdog started`);
  }

  stopWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = undefined;
      console.log(`Watchdog stopped`);
    }
  }
}

export { Sensor, SensorLogger };
