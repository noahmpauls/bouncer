import type { ViewtimeCooldownData } from "@bouncer/limit/ViewtimeCooldownLimit";
import type { ILimitInput } from "./LimitInput";

const template = document.createElement("template");
template.id = "viewtime-cooldown-limit-input-template";
template.innerHTML = `<p>Viewtime Cooldown Limit</p>
<label for="viewtime">Viewtime:</label>
<input type="text" id="viewtime" name="viewtime" />
<label for="cooldown">Cooldown:</label>
<input type="text" id="cooldown" name="cooldown" />`;


export class ViewtimeCooldownLimitInput extends HTMLElement implements ILimitInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  get value(): ViewtimeCooldownData {
    const viewtimeInput = this.shadow.getElementById("viewtime") as HTMLInputElement;
    const cooldownInput = this.shadow.getElementById("cooldown") as HTMLInputElement;
    return {
      type: "ViewtimeCooldown",
      data: {
        msViewtime: Number(viewtimeInput.value),
        msCooldown: Number(cooldownInput.value),
      }
    }
  }
}


declare global {
  interface Window {
    ViewtimeCooldownLimitInput: typeof ViewtimeCooldownLimitInput
  }
  interface HTMLElementTagNameMap {
    'viewtime-cooldown-limit-input': ViewtimeCooldownLimitInput
  }
}

if (!window.customElements.get('viewtime-cooldown-limit-input')) {
  window.ViewtimeCooldownLimitInput = ViewtimeCooldownLimitInput;
  window.customElements.define('viewtime-cooldown-limit-input', ViewtimeCooldownLimitInput);
}
