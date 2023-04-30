import type { EnforcerData } from "@bouncer/enforcer";
import { ScheduledLimitInput } from "./ScheduledLimitInput";

export interface IEnforcerInput extends HTMLElement {
  value: EnforcerData;
}

const template = document.createElement("template");
template.id = "enforcer-input-template";
template.innerHTML = `<p>Enforcer:</p>
<div>
  <scheduled-limit-input id="enforcer"></scheduled-limit-enforcer>
</div>`;

export class EnforcerInput extends HTMLElement implements IEnforcerInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }
  
  get value(): EnforcerData {
    const enforcerInput = this.shadow.getElementById("enforcer") as IEnforcerInput;
    return enforcerInput.value;
  }
}


declare global {
  interface Window {
    EnforcerInput: typeof EnforcerInput
  }
  interface HTMLElementTagNameMap {
    'enforcer-input': EnforcerInput
  }
}

if (!window.customElements.get('enforcer-input')) {
  window.EnforcerInput = EnforcerInput;
  window.customElements.define('enforcer-input', EnforcerInput);
}

