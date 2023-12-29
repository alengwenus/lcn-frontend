import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-input/paper-input";
import "@polymer/paper-listbox/paper-listbox";
import "../../../../../../components/ha-radio";
import "../../../../../../components/ha-formfield";
import {
  css,
  html,
  LitElement,
  TemplateResult,
  CSSResult,
  PropertyValues,
} from "lit";
import { customElement, property, query } from "lit/decorators";
import type { HaRadio } from "@ha/components/ha-radio";
import { HaSwitch } from "@ha/components/ha-switch";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { LightConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-light-element")
export class LCNConfigLightElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public domainData: LightConfig = {
    output: "OUTPUT1",
    dimmable: false,
    transition: 0,
  };

  @property() private _portType = "output";

  @query("#ports-listbox") private _portsListBox;

  private _invalid = false;

  private _outputPorts: ConfigItem[] = [
    { name: "Output 1", value: "OUTPUT1" },
    { name: "Output 2", value: "OUTPUT2" },
    { name: "Output 3", value: "OUTPUT3" },
    { name: "Output 4", value: "OUTPUT4" },
  ];

  private _relayPorts: ConfigItem[] = [
    { name: "Relay 1", value: "RELAY1" },
    { name: "Relay 2", value: "RELAY2" },
    { name: "Relay 3", value: "RELAY3" },
    { name: "Relay 4", value: "RELAY4" },
    { name: "Relay 5", value: "RELAY5" },
    { name: "Relay 6", value: "RELAY6" },
    { name: "Relay 7", value: "RELAY7" },
    { name: "Relay 8", value: "RELAY8" },
  ];

  private _ports = { output: this._outputPorts, relay: this._relayPorts };

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid = this._validateTransition(this.domainData.transition);
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    this.dispatchEvent(
      new CustomEvent("validity-changed", {
        detail: this._invalid,
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div>
        <div>
          <div>Port:</div>
          <ha-formfield label="Output">
            <ha-radio
              name="port"
              value="output"
              .checked=${this._portType === "output"}
              @change=${this._portTypeChanged}
            ></ha-radio>
          </ha-formfield>
          <ha-formfield label="Relay">
            <ha-radio
              name="port"
              value="relay"
              .checked=${this._portType === "relay"}
              @change=${this._portTypeChanged}
            ></ha-radio>
          </ha-formfield>
        </div>
        <paper-dropdown-menu
          label="Port"
          .value=${this._ports[this._portType][0].name}
        >
          <paper-listbox
            id="ports-listbox"
            slot="dropdown-content"
            @selected-item-changed=${this._portChanged}
          >
            ${this._ports[this._portType].map(
              (port) => html`
                <paper-item .itemValue=${port.value}>${port.name}</paper-item>
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <div id="dimmable">
          <label>Dimmable:</label>
          <ha-switch
            .checked=${this.domainData.dimmable}
            @change=${this._dimmableChanged}
          ></ha-switch>
        </div>

        <paper-input
          label="Transition"
          type="number"
          value="0"
          min="0"
          max="486"
          @value-changed=${this._transitionChanged}
          .invalid=${this._validateTransition(this.domainData.transition)}
          error-message="Transition must be in 0..486."
        ></paper-input>
      </div>
    `;
  }

  private _portTypeChanged(ev: CustomEvent): void {
    this._portType = (ev.target as HaRadio).value;
    this._portsListBox.selectIndex(0);

    const port = this._ports[this._portType][this._portsListBox.selected];
    this.domainData.output = port.value;
  }

  private _portChanged(ev: CustomEvent): void {
    if (!ev.detail.value) {
      return;
    }
    const port = this._ports[this._portType][this._portsListBox.selected];
    this.domainData.output = port.value;
  }

  private _dimmableChanged(ev: CustomEvent): void {
    this.domainData.dimmable = (ev.target as HaSwitch).checked;
  }

  private _transitionChanged(ev: CustomEvent): void {
    this.domainData.transition = +ev.detail.value;
    this.requestUpdate();
  }

  private _validateTransition(transition: number): boolean {
    return !(transition >= 0 && transition <= 486);
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #ports-listbox {
          width: 120px;
        }
        #dimmable {
          margin-top: 10px;
        }
        ha-switch {
          margin-left: 25px;
        }
      `,
    ];
  }
}
