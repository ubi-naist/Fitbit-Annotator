import * as fs from "fs";
import { battery as batt } from "power";
import { outbox } from "file-transfer";

import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
import { HeartRateSensor } from "heart-rate";

class Sensor {
  type = null;
  device = null;
  loggingFile = "";
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
    const dataLogger = new DataLogger("heartrate");
    device.addEventListener("reading", () => {
      const r = device.readings;
      console.log("HeartRateSensor records:");
      let dataStr = "";
      for (let i = 0; i < r.timestamp.length; i++) {
        console.log(`${this._zeropad(i)} ${r.timestamp[i]}: ${r.heartRate[i]}`);
        dataStr += `${r.timestamp[i]};HRTR;${r.heartRate[i]}\n`;
      }
      dataLogger.logData(dataStr);
    });
    console.log(`HeartRateSensor sensor initialized`);
    return device;
  }

  _zeropad = (num) => ("0000000" + num).slice(-this.zeroPadding);
}

class SensorManager {
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
    const notEnoughEnergy =
      batt.chargeLevel <= this.minBatteryLevel && !batt.charging;
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

  onWatchdogEvent() {}

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
    this.onWatchdogEvent();
  }

  stopWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = undefined;
      console.log(`Watchdog stopped`);
    }
    this.onWatchdogEvent();
  }
}

class DataLogger {
  loggerName = undefined;
  logfile = undefined;
  logfileSizeLimit = 500 * 1024; // bytes
  storageHardLimit = 4.5 * 1000 * 1024; // bytes
  csvHeader = "timestamp;sensor;data";
  static storagePrefix = "/private/data";
  static filenameRegex = /^\w+_\d+-\d+\.log\.csv$/;

  constructor(loggerName) {
    this.loggerName = loggerName;
    this.logfile = this._createFilename();
    this.initLogFile(this.logfile);
  }

  get isLogfileTooBig() {
    const filename = `${DataLogger.storagePrefix}/${this.logfile}`;
    if (!fs.existsSync(filename)) {
      return undefined;
    }
    const stat = fs.statSync(filename);
    return stat.size > this.logfileSizeLimit;
  }

  get storageSize() {
    const dir = fs.listDirSync(DataLogger.storagePrefix);
    let size = 0;
    let dirIter = undefined;
    while ((dirIter = dir.next()) && !dirIter.done) {
      size += fs.statSync(dirIter.value).size;
    }
    return size;
  }

  initLogFile(filename) {
    const filepath = `${DataLogger.storagePrefix}/${filename}`;
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, `${this.csvHeader}\n`, "utf-8");
      if (!fs.existsSync(filepath)) {
        console.error(
          `DataLogger(${this.loggerName}): Logging filename cannot be created`
        );
        this.logfile = undefined;
      }
    }
    this.logfile = filename;
    return this.logfile;
  }

  logData(dataStr) {
    const storageFreeSpace = this.storageHardLimit - this.storageSize;
    if ((dataStr.length*2) > storageFreeSpace) {
      console.error(
        `DataLogger(${this.loggerName}): cannot write ` +
          `${dataStr.length} bytes of data. Free space: ${storageFreeSpace}`
      );
      return false;
    }
    const fd = this._getFD();
    fs.writeSync(fd, this._str2array(dataStr));
    fs.closeSync(fd);
  }

  _createFilename() {
    const dt = new Date();
    const month = dt.getMonth() + 1 + "";
    month = month.length == 1 ? "0" + month : month;
    const day = dt.getDate() + "";
    day = day.length == 1 ? "0" + day : day;
    const hours = dt.getHours() + "";
    hours = hours.length == 1 ? "0" + hours : hours;
    const mins = dt.getMinutes() + "";
    mins = mins.length == 1 ? "0" + mins : mins;
    const secs = dt.getSeconds() + "";
    secs = secs.length == 1 ? "0" + secs : secs;
    const dateString = `${dt.getFullYear()}${month}${day}-${hours}${mins}${secs}`;
    return `${this.loggerName}_${dateString}.log.csv`;
  }

  _getFD() {
    const fileTooBig = this.isLogfileTooBig;
    if (fileTooBig === undefined || fileTooBig) {
      // creating new log file
      console.log(`File ${this.logfile} fileTooBig? ${fileTooBig}`);
      const newLogfile = this._createFilename();
      if (!this.initLogFile(newLogfile)) {
        return undefined;
      }
    }
    const size = fs.statSync(`${DataLogger.storagePrefix}/${this.logfile}`).size;
    console.log(`Opening file ${this.logfile} of ${size} bytes`);
    return fs.openSync(this.logfile, "a");
  }

  _str2array(str) {
    const buf = new ArrayBuffer(str.length * 2);
    const bufView = new Uint16Array(buf);
    for (let i = 0; i < str.length; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}

class DataBackupDaemon
{
  timer = undefined;
  backedupSuffix = "backd";
  frequency = 60 * 1000; // milliseconds

  /**
   * @param {integer} freq The Daemon will check every <freq> seconds for new files to backup
   */
  constructor(freq=60) {
    this.frequency = freq * 1000;
  }

  onBackupEvent() {}

  start() {
    console.log("backer started");
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      console.log("DataBackupDaemon backing up");
      this.backupToCompanion();
      this.timer = undefined;
      this.timer = this.start();
    }, this.frequency);
    console.log("DataBackupDaemon started");
    this.onBackupEvent();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
      console.log("DataBackupDaemon stopped");
    }
    this.onBackupEvent();
  }

  backupToCompanion(includeLatestFile = false) {
    const fileList = this._fileList();
    if (fileList.length > 0 && !includeLatestFile) {
      fileList.pop();
    }
    console.log(`Files to backup: ${fileList.length}`);
    fileList.forEach((filename) => {
      outbox
        .equeueFile(filename)
        .then((ft) => {
          console.log(`File ${filename} got enqueued for transfer to Companion`);
          ft.addEventListener("change", (obj, _) => {
            console.log(`File transfer of ${filename} changed to: ${obj.readyState}`);
            if (obj.readyState == "transferred") {
              if (this._markAsTransferred(filename)) {
                console.log(`${filename} marked as transferred`);
              }
            }
          });
        })
        .catch((error) => {
          console.log(`Failed to queue file transfer of ${filename}: ${error}`);
        });
    });
  }

  deleteBackedupFiles() {
    const dirIter = fs.listDirSync(DataLogger.storagePrefix);
    const backedRgx = new RegExp(`/*.${this.backedupSuffix}$/`);
    let item = null;
    while((item = dirIter.next()) && !dirIter.done) {
      if (backedRgx.test(item.value)) {
        fs.unlinkSync(item.value);
        console.log(`File ${item.value} deleted`);
      }
    }
  }

  _fileList() {
    const dirIter = fs.listDirSync(DataLogger.storagePrefix);
    let fileList = new Array();
    let item = null;
    while((item = dirIter.next()) && !dirIter.done) {
      if (DataLogger.filenameRegex.test(item.value)) {
        fileList.push(item.value);
      }
    }
    return fileList.length > 0 ? fileList.sort(): fileList;
  }

  _markAsTransferred(filename) {
    const fn = DataLogger.storagePrefix + '/' + filename;
    if (!fs.existsSync(fn)) {
      return false;
    }
    fn.renameSync(fn, fn + '.' + this.backedupSuffix);
    return true;
  }
}

export { Sensor, SensorManager, DataLogger, DataBackupDaemon };
