import { me as companion } from "companion";
import { LogSender } from "./LogSender";

if (!companion.permissions.granted("run_background")) {
  console.warn("run_background permission is not set");
}

const MILLISECONDS_PER_MINUTE = 1000 * 60;

companion.wakeInterval = 1 * MILLISECONDS_PER_MINUTE;
companion.addEventListener("wakeinterval", onWakeHandler);

if (companion.launchReasons.wokenUp) {
  onWakeHandler();
}

function onWakeHandler() {
  console.log("Wake interval happened!");
}