import type { MatcherData } from "@bouncer/matcher";
import { ExactHostnameMatcherInput } from "./ExactHostnameMatcherInput";

export interface IMatcherInput extends HTMLElement {
  value: MatcherData;
}

const template = document.createElement("template");
template.id = "matcher-input-template";
template.innerHTML = `<p>Matcher:</p>
<div>
  <exact-hostname-matcher-input id="matcher"></exact-hostname-matcher-input>
</div>`;


export class MatcherInput extends HTMLElement implements IMatcherInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }
  
  get value(): MatcherData {
    const matcherInput = this.shadow.getElementById("matcher") as IMatcherInput;
    return matcherInput.value;
  }
}


declare global {
  interface Window {
    MatcherInput: typeof MatcherInput
  }
  interface HTMLElementTagNameMap {
    'matcher-input': MatcherInput
  }
}

if (!window.customElements.get('matcher-input')) {
  window.MatcherInput = MatcherInput;
  window.customElements.define('matcher-input', MatcherInput);
}
