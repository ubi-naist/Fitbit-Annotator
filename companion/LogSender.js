import { inbox } from "file-transfer";
import { settingsStorage } from "settings";

class LogSender {
  apiURL = "";
  fileUploadEndpoint = "";

  constructor() {
    // this._setListeners();
    // For testing API communication on App launch
    // you need to first configure API url and file upload endpoint
    // in the user Settings interface of the fitbit app or simulator
    // this.apiCallTest("GET-TestAPI");
  }

  _setListeners() {
    // this doesn't work, it {this.processInbox} loses "this" context
    // if it's called like this
    inbox.addEventListener("newfile", this.processInbox);
  }

  apiCallTest(type) {
    let url, method, headers;
    switch (type) {
      case "GET-Generic":
        url = `https://api.my-ip.io/v2/ip.json`;
        method = "GET";
        headers = { "Content-Type": "application/json" };
        break;
      case "GET-TestAPI":
        const fileUploadEndpoint = this.getEndpointURL("fupendpoint");
        url = `${fileUploadEndpoint}?test=LogSender`;
        method = "GET";
        headers = { "Content-Type": "application/json" };
        break;
      default:
        console.log("ApiCallTest, no test selected");
        break;
    }
    console.log(`Testing call to ${url}`);
    fetch(url, { method: method, headers: headers })
      .then((res) => {
        res.json().then((data) => {
          console.log(`Correct testing call: ${JSON.stringify(data)}`);
        });
      })
      .catch((error) => {
        console.log(`Testing call failed: ${error}`);
      });
  }

  getEndpointURL(settingsName) {
    this.apiURL = JSON.parse(settingsStorage.getItem("apiurl")).name;
    const endpoint = JSON.parse(settingsStorage.getItem(settingsName)).name;
    return `${this.apiURL}/${endpoint}`;
  }

  async processInbox() {
    let inboxItem, fileUploadEndpoint;
    try {
      fileUploadEndpoint = this.getEndpointURL("fupendpoint");
    } catch (_) {
      console.warn("File Backup is not setup in Settings screen");
      return;
    }
    // console.log(`ProcessInbox: ${fileUploadEndpoint}`);
    while ((inboxItem = await inbox.pop())) {
      console.log(`LogSender: scheduling transmission of ${inboxItem.name}`);
      fetch(fileUploadEndpoint, {
        method: "POST",
        body: await inboxItem.arrayBuffer(),
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${inboxItem.name}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            console.info(`LogSender: ${JSON.stringify(data)}`);
          });
        })
        .catch((error) => {
          console.warn(`LogSender: failed to send ${inboxItem.name}: ${error}`);
        });
    }
  }
}

export { LogSender };
