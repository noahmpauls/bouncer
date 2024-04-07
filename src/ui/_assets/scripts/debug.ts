import type { IConfiguration } from "@bouncer/config";
import { BrowserClientMessenger, ClientMessageType, ControllerMessageType } from "@bouncer/message";

const messenger = BrowserClientMessenger;

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

refreshConfig();

function setConfigForm(config: IConfiguration) {
  const maxLogsInput = configForm.querySelector(`#max-logs`) as HTMLInputElement;
  maxLogsInput.value = String(config.maxLogs);
}

function refreshConfig() {
  messenger.send({
    type: ClientMessageType.CONFIG_GET,
  });
}
