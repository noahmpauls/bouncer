// TODO: this is dumb.
type DumbPeriod = "minute" | "hour" | "day" | "week";

const template = document.createElement("template");
template.id = "period-interval-input-template";
template.innerHTML = `<div>
  <label for="start">Start:</label>
  <input type="text" id="start" name="start" />
  <label for="end">End:</label>
  <input type="text" id="end" name="end" />
  <button id="remove">X</button>
</div>`;


export class PeriodIntervalInput extends HTMLElement {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
    const removeButton = this.shadow.getElementById("remove") as HTMLButtonElement;
    removeButton.addEventListener("click", () => {
      this.dispatchEvent(new Event("period-interval-remove", { composed: true, bubbles: true }));
    });
  }

  get value(): { start: number, end: number } {
    const startInput = this.shadow.getElementById("start") as HTMLInputElement;
    const endInput = this.shadow.getElementById("end") as HTMLInputElement;
    return {
      start: Number(startInput.value),
      end: Number(endInput.value),
    }
  }
}


declare global {
  interface Window {
    PeriodIntervalInput: typeof PeriodIntervalInput
  }
  interface HTMLElementTagNameMap {
    'period-interval-input': PeriodIntervalInput
  }
}

if (!window.customElements.get('period-intervalinput')) {
  window.PeriodIntervalInput = PeriodIntervalInput;
  window.customElements.define('period-interval-input', PeriodIntervalInput);
}

