import type { LimitData } from "@bouncer/limit";
import { ViewtimeCooldownLimitInput } from "./ViewtimeCooldownLimitInput";
import { WindowCooldownLimitInput } from "./WindowCooldownLimitInput";

export interface ILimitInput extends HTMLElement {
  value: LimitData;
}

const template = document.createElement("template");
template.id = "limit-input-template";
template.innerHTML = `<label for="type">Limit:</label>
<select name="type" id="type"></select>
<div id="limit-input"></div>`;


const limitOptions = [
  {
    display: "Always",
    value: "always",
  },
  {
    display: "Viewtime",
    value: "viewtime",
  },
  {
    display: "Window",
    value: "window",
  }
];


export class LimitInput extends HTMLElement implements ILimitInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
    const limitSelect = this.shadow.getElementById("type") as HTMLSelectElement;
    for (const limitOption of limitOptions) {
      const option = document.createElement("option");
      option.value = limitOption.value;
      option.innerText = limitOption.display;
      limitSelect.appendChild(option);
    }
    const limitInputContainer = this.shadow.getElementById("limit-input") as HTMLDivElement;
    limitSelect.addEventListener("change", function() {
      limitInputContainer.innerHTML = "";
      let limitInput = null;
      switch (limitSelect.value) {
        case "always":
          break;
        case "viewtime":
          limitInput = document.createElement("viewtime-cooldown-limit-input");
          break;
        case "window":
          limitInput = document.createElement("window-cooldown-limit-input");
          break;
      }
      if (limitInput !== null) {
        limitInput.id = "limit";
        limitInputContainer.appendChild(limitInput);
      }
    });
  }
  
  get value(): LimitData {
    const limitSelect = this.shadow.getElementById("type") as HTMLSelectElement;
    if (limitSelect.value === "always") {
      return { type: "AlwaysBlock" }
    } else {
      const limitInput = this.shadow.getElementById("limit") as ILimitInput;
      return limitInput.value;
    }
  }
}


declare global {
  interface Window {
    LimitInput: typeof LimitInput
  }
  interface HTMLElementTagNameMap {
    'limit-input': LimitInput
  }
}

if (!window.customElements.get('limit-input')) {
  window.LimitInput = LimitInput;
  window.customElements.define('limit-input', LimitInput);
}
