import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { SwitchConfig } from "types/lcn";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import type { HaRadio } from "@ha/components/ha-radio";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-switch-element")
export class LCNConfigSwitchElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public domainData: SwitchConfig = { output: "OUTPUT1" };

  @property() private _portType = "output";

  @query("#ports-listbox") private _portsListBox;

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

  protected render(): TemplateResult {
    return html`
      <form>
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
      </form>
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

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #ports-listbox {
          width: 120px;
        }
      `,
    ];
  }
}
