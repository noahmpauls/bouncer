import type { PolicyData } from "@bouncer/policy";
import { BasicPolicyInput } from "./BasicPolicyInput";

export interface IPolicyInput extends HTMLElement {
  value: PolicyData;
}

const template = document.createElement("template");
template.id = "policy-input-template";
template.innerHTML = `<p>Policy:</p>
<div>
  <basic-policy-input id="policy"></basic-policy-input>
</div>`;


export class PolicyInput extends HTMLElement implements IPolicyInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }
  
  get value(): PolicyData {
    const policyInput = this.shadow.getElementById("policy") as IPolicyInput;
    return policyInput.value;
  }
}


declare global {
  interface Window {
    PolicyInput: typeof PolicyInput
  }
  interface HTMLElementTagNameMap {
    'policy-input': PolicyInput
  }
}

if (!window.customElements.get('policy-input')) {
  window.PolicyInput = PolicyInput;
  window.customElements.define('policy-input', PolicyInput);
}
