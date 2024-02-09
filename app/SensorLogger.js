import { battery as batt } from "power";
import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
import { HeartRateSensor } from "heart-rate";

class Sensor {
  type = null;
  device = null;
  zeroPadding = 3;
  static availableSensors = {
    accelerometer: {
      builder: "accelerometerBuilder",
      freq: 5, // hertz
      batch: 150, // samples to get batched per triggered event
    },
    gyroscope: {
      builder: "gyroscopeBuilder",
      freq: 5,
      batch: 150,
    },
    heartrate: {
      builder: "heartrateBuilder",
      freq: 1,
      batch: 30,
    },
  };

  constructor(type, freq = null, batch = null) {
    this.type = type.toLowerCase().trim();

    if (!Sensor.availableSensors[this.type]) {
      throw new TypeError(`"${this.type}" sensor is not implemented`);
    }

    const metadata = Sensor.availableSensors[this.type];
    this.freq = freq || metadata.freq;
    this.batch = batch || metadata.batch;
    this.device = this[metadata.builder]();
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
  minBatteryLevel = 20;
  watchdogTimeLimit = 1 * 10 * 1000; // milliseconds
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
    const notEnoughEnergy = batt.chargeLevel <= this.minBatteryLevel && !batt.charging;
    if (notEnoughEnergy) {
      this.onNotEnoughEnergy();
    }
    return notEnoughEnergy;
  }

  get anySensorActive() {
    return this.sensors.some((sensor) => sensor.isActive);
  }

  get noneSensorsActive() {
    return !this.anySensorActive;
  }

  onNotEnoughEnergy() {}

  onNonStart() {}

  /**
   * Callback that will executed when all sensors have been stopped
   * This can be implemented by GUI elements to provide automatic behaviors
   * example: Toggle Button automatic deactivation
   */
  onAllSensorsStopped() {}

  enableSensor(type, freq = null, batch = null) {
    type = type.toLowerCase().trim();

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

    if (Sensor.availableSensors[type]) {
      const metadata = Sensor.availableSensors[type];
      freq = freq || metadata.freq;
      batch = batch || metadata.batch;
      this.sensors.push(new Sensor(type, freq, batch));
    } else {
      console.error(`Sensor "${type}" is not implemented, cannot be enabled.`);
    }
  }

  disableSensor(type) {
    type = type.toLowerCase().trim();
    this.stop([type]);
    const indexToRemove = null;
    this.sensors.some((sensor, idx) => {
      if (sensor.type === type) {
        indexToRemove = idx;
        return true;
      }
    });
    if (indexToRemove !== null) {
      this.sensors.splice(indexToRemove, 1);
    }
  }

  start(sensors = []) {
    if (this.notEnoughEnergy) {
      console.warn(
        "SensorLogger not started, battery low: " + batt.chargeLevel
      );
      this.onNonStart();
      return;
    }
    this.sensors.forEach((sensor) => {
      if (sensors.length < 1 || sensors.indexOf(sensor.type) !== -1) {
        // It should start current sensor if 1. <sensors> is not defined 2. the sensor was defined in <sensors>
        sensor.start();
      } // it won't start the sensor if <sensors> is defined AND this sensor is not defined in <sensors>
    });
    if (this.anySensorActive) {
      this.startWatchdog();
    } else {
      this.onNonStart();
    }
  }

  stop(sensors = []) {
    this.sensors.forEach((sensor) => {
      if (sensors.length < 1 || sensors.indexOf(sensor.type) !== -1) {
        // It should stop current sensor if 1. <sensors> is not defined 2. the sensor was defined in <sensors>
        sensor.stop();
      } // it won't stop the sensor if <sensors> is defined AND this sensor is not defined in <sensors>
    });
    if (this.noneSensorsActive) {
      this.stopWatchdog();
      this.onAllSensorsStopped();
    }
  }

  /**
   * Stops SensorLogger in case battery is less than <this.minBatteryLevel>
   * runs every <this.watchdogTimeLimit>
   */
  startWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    this.watchdogTimer = setTimeout(() => {
      console.log(`Watchdog, enough batt? ${!this.notEnoughEnergy}`);
      if (this.notEnoughEnergy) {
        this.stop();
        return;
      }
      this.watchdogTimer = undefined;
      this.startWatchdog();
    }, this.watchdogTimeLimit);
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
