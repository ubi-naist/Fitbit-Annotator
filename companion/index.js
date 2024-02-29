import { me as companion } from "companion";
import { LogSender } from "./LogSender";

if (!companion.permissions.granted("run_background")) {
  console.warn("run_background permission is not set");
}

const MILLISECONDS_PER_MINUTE = 1000 * 60;
const logSender = new LogSender();
const isInSimulator =
  companion.host.os.name == "Android" && companion.host.os.version == "unknown";

function onWakeHandler() {
  console.log("Wake interval: processing inbox");
  logSender.processInbox();
}

function startSimulatorWaker() {
  setTimeout(() => {
    onWakeHandler();
    startSimulatorWaker();
  }, 60 * 1000);
}

if (isInSimulator) {
  onWakeHandler();
  startSimulatorWaker();
} else {
  companion.wakeInterval = 10 * MILLISECONDS_PER_MINUTE;
  companion.addEventListener("wakeinterval", onWakeHandler);

  if (companion.launchReasons.wokenUp) {
    onWakeHandler();
  }
}
