import { Configuration, type IConfiguration } from "@bouncer/config";
import { LogsStorage, type ILogsReader, type Log } from "@bouncer/logs";
import { BrowserClientMessenger, ClientMessageType, ControllerMessageType } from "@bouncer/message";

const messenger = BrowserClientMessenger;
// TODO: shouldn't need a config object for a logs reader
const logsReader: ILogsReader = LogsStorage.browser(Configuration.default());

messenger.addReceiver((message) => {
  switch (message.type) {
    case ControllerMessageType.CONFIG_GET:
      setConfigForm(message.config);
      break;
    default:
      break;
  }
});

const configForm = document.getElementById("configuration") as HTMLFormElement;
const logsContainer = document.getElementById("logs") as HTMLPreElement;
const logsRefresh = document.getElementById("refresh-logs") as HTMLButtonElement;

configForm.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(configForm);
  const configUpdate: Partial<IConfiguration> = {
    maxLogs: Number(formData.get("maxLogs")),
  }
  messenger.send({
    type: ClientMessageType.CONFIG_UPDATE,
    config: configUpdate,
  });
});

logsRefresh.addEventListener("click", refreshLogs);

refreshConfig();
refreshLogs();

function setConfigForm(config: IConfiguration) {
  const maxLogsInput = configForm.querySelector(`#max-logs`) as HTMLInputElement;
  maxLogsInput.value = String(config.maxLogs);
}

function refreshConfig() {
  messenger.send({
    type: ClientMessageType.CONFIG_GET,
  });
}

async function refreshLogs() {
  const logs = await logsReader.logs();
  const formattedLogs = logs.reverse().map(log => formatLog(log));
  logsContainer.replaceChildren();
  for (const log of formattedLogs) {
    logsContainer.appendChild(log);
    logsContainer.appendChild(document.createElement("br"));
  }
}

function formatLog(log: Log): HTMLElement {
  const timestamp = formatTimestamp(log);
  const level = formatLevel(log);
  const category = formatCategory(log);
  const message = formatMessage(log);

  const logContainer = document.createElement("code");
  logContainer.classList.add("log");
  logContainer.classList.add(log.level);
  logContainer.append(timestamp, level, category, message);
  logContainer.title = log.category ?? "";
  return logContainer;
}

function formatTimestamp(log: Log): HTMLElement {
  const timestampDisplay = document.createElement("time");
  const date = new Date(log.timestamp);
  const formattedDate = date.toISOString();
  timestampDisplay.innerText = formattedDate.split("T")[1].replace("Z", "");
  timestampDisplay.dateTime = formattedDate;
  return timestampDisplay;
}

function formatLevel(log: Log): HTMLElement {
  const levelDisplay = document.createElement("span");
  levelDisplay.classList.add("level");
  levelDisplay.classList.add(log.level);
  const content = log.level.charAt(0).toUpperCase();
  levelDisplay.innerText = content;
  return levelDisplay;
}

function formatCategory(log: Log): HTMLElement {
  const categoryDisplay = document.createElement("span");
  categoryDisplay.classList.add("category");
  categoryDisplay.innerText = log.category ?? "";
  return categoryDisplay;
}

function formatMessage(log: Log): HTMLElement {
  const messageDisplay = document.createElement("span");
  messageDisplay.classList.add("message");
  messageDisplay.innerText = log.message;
  return messageDisplay;
}