import type { ExactHostnameMatcherData } from "@bouncer/matcher/ExactHostnameMatcher";
import type { IMatcherInput } from "./MatcherInput";


const template = document.createElement("template");
template.id = "exact-hostname-matcher-input-template";
template.innerHTML = `<p>Exact Hostname Matcher</p>
<label for="hostname">Hostname:</label>
<input type="text" id="hostname" name="hostname" />`


export class ExactHostnameMatcherInput extends HTMLElement implements IMatcherInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  get value(): ExactHostnameMatcherData {
    const hostnameInput = this.shadow.getElementById("hostname") as HTMLInputElement;
    return {
      type: "ExactHostname",
      data: {
        hostname: hostnameInput.value
      }
    }
  }
}


declare global {
  interface Window {
    ExactHostnameMatcherInput: typeof ExactHostnameMatcherInput
  }
  interface HTMLElementTagNameMap {
    'exact-hostname-matcher-input': ExactHostnameMatcherInput
  }
}

if (!window.customElements.get('exact-hostname-matcher-input')) {
  window.ExactHostnameMatcherInput = ExactHostnameMatcherInput;
  window.customElements.define('exact-hostname-matcher-input', ExactHostnameMatcherInput);
}
