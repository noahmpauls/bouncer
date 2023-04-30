import type { WindowCooldownData } from "@bouncer/limit/WindowCooldownLimit";
import type { ILimitInput } from "./LimitInput";

const template = document.createElement("template");
template.id = "window-cooldown-limit-input-template";
template.innerHTML = `<p>Window Cooldown Limit</p>
<label for="window">Window:</label>
<input type="text" id="window" name="window" />
<label for="cooldown">Cooldown:</label>
<input type="text" id="cooldown" name="cooldown" />`;


export class WindowCooldownLimitInput extends HTMLElement implements ILimitInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  get value(): WindowCooldownData {
    const windowInput = this.shadow.getElementById("window") as HTMLInputElement;
    const cooldownInput = this.shadow.getElementById("cooldown") as HTMLInputElement;
    return {
      type: "WindowCooldown",
      data: {
        msWindow: Number(windowInput.value),
        msCooldown: Number(cooldownInput.value),
      }
    }
  }
}


declare global {
  interface Window {
    WindowCooldownLimitInput: typeof WindowCooldownLimitInput
  }
  interface HTMLElementTagNameMap {
    'window-cooldown-limit-input': WindowCooldownLimitInput
  }
}

if (!window.customElements.get('window-cooldown-limit-input')) {
  window.WindowCooldownLimitInput = WindowCooldownLimitInput;
  window.customElements.define('window-cooldown-limit-input', WindowCooldownLimitInput);
}

