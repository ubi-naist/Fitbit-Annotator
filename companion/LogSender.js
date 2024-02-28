import { inbox } from "file-transfer";
import { settingsStorage } from "settings";

class LogSender {
  apiURL = "";
  fupendpoint = "";

  constructor() {
    this.apiURL = settingsStorage.getItem("apiurl");
    this.fupendpoint = settingsStorage.getItem("fupendpoint");
  }

  async processIbox() {
    while ((inboxItem = await inbox.pop())) {
      sendPayload(inboxItem);
    }
  }

  async sendPayload(inboxItem) {
    fetch(`${this.apiURL}/${this.fupendpoint}`, {
      method: "POST",
      body: await inboxItem.arrayBuffer(),
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${inboxItem.name}`,
      },
    });
  }
}

export { LogSender };
