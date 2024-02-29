import { inbox } from "file-transfer";
import { settingsStorage } from "settings";

class LogSender {
  apiURL = "";
  fileUploadEndpoint = "";

  constructor() {
    this.setupAPI();
    this._setListeners();
    // console.log(`Constructor: file upload endpoint ${this.fileUploadEndpoint}`);
    this.apiCallTest("GET-LocalTestAPI");
  }

  _setListeners() {
    inbox.addEventListener("newfile", this.processInbox);
    settingsStorage.addEventListener("change", (evt) => {
      this.setupAPI();
    });
  }

  apiCallTest(type) {
    let url, method, headers;
    switch (type) {
      case "GET-Generic":
        url = `https://api.my-ip.io/v2/ip.json`;
        method = "GET";
        headers = { "Content-Type": "application/json" };
        break;
      case "GET-LocalTestAPI":
        url = `${this.fileUploadEndpoint}?test=LogSender`;
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

  setupAPI() {
    this.apiURL = JSON.parse(settingsStorage.getItem("apiurl")).name;
    const endpoint = JSON.parse(settingsStorage.getItem("fupendpoint")).name;
    this.fileUploadEndpoint = `${this.apiURL}/${endpoint}`;
    // console.log(`SetupAPI: file upload endpoint ${this.fileUploadEndpoint}`);
  }

  async processInbox() {
    let inboxItem;
    // console.log(`ProcessInbox: ${this.fileUploadEndpoint}`);
    while ((inboxItem = await inbox.pop())) {
      console.log(`LogSender: scheduling transmission of ${inboxItem.name}`);
      fetch(this.fileUploadEndpoint, {
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
