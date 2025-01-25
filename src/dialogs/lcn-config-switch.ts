import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import type { HaSelect } from "@ha/components/ha-select";
import "@ha/components/ha-textfield";
import type { CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, SwitchConfig } from "types/lcn";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import type { HaRadio } from "@ha/components/ha-radio";

interface ConfigItem {
  name: string;
  value: string;
}

interface ConfigItemCollection {
  name: string;
  value: ConfigItem[];
  id: string;
}

@customElement("lcn-config-switch-element")
export class LCNConfigSwitchElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public domainData: SwitchConfig = { output: "OUTPUT1" };

  @state() private _portType!: ConfigItemCollection;

  @state() private _port!: ConfigItem;

  @query("#port-select") private _portSelect;

  private get _outputPorts(): ConfigItem[] {
    const output: string = this.lcn.localize("output");
    return [
      { name: output + " 1", value: "OUTPUT1" },
      { name: output + " 2", value: "OUTPUT2" },
      { name: output + " 3", value: "OUTPUT3" },
      { name: output + " 4", value: "OUTPUT4" },
    ];
  }

  private get _relayPorts(): ConfigItem[] {
    const relay: string = this.lcn.localize("relay");
    return [
      { name: relay + " 1", value: "RELAY1" },
      { name: relay + " 2", value: "RELAY2" },
      { name: relay + " 3", value: "RELAY3" },
      { name: relay + " 4", value: "RELAY4" },
      { name: relay + " 5", value: "RELAY5" },
      { name: relay + " 6", value: "RELAY6" },
      { name: relay + " 7", value: "RELAY7" },
      { name: relay + " 8", value: "RELAY8" },
    ];
  }

  private get _regulators(): ConfigItem[] {
    const regulator: string = this.lcn.localize("regulator");
    return [
      { name: regulator + " 1", value: "R1VARSETPOINT" },
      { name: regulator + " 2", value: "R2VARSETPOINT" },
    ];
  }

  private _keys: ConfigItem[] = [
    { name: "A1", value: "A1" },
    { name: "A2", value: "A2" },
    { name: "A3", value: "A3" },
    { name: "A4", value: "A4" },
    { name: "A5", value: "A5" },
    { name: "A6", value: "A6" },
    { name: "A7", value: "A7" },
    { name: "A8", value: "A8" },
    { name: "B1", value: "B1" },
    { name: "B2", value: "B2" },
    { name: "B3", value: "B3" },
    { name: "B4", value: "B4" },
    { name: "B5", value: "B5" },
    { name: "B6", value: "B6" },
    { name: "B7", value: "B7" },
    { name: "B8", value: "B8" },
    { name: "C1", value: "C1" },
    { name: "C2", value: "C2" },
    { name: "C3", value: "C3" },
    { name: "C4", value: "C4" },
    { name: "C5", value: "C5" },
    { name: "C6", value: "C6" },
    { name: "C7", value: "C7" },
    { name: "C8", value: "C8" },
    { name: "D1", value: "D1" },
    { name: "D2", value: "D2" },
    { name: "D3", value: "D3" },
    { name: "D4", value: "D4" },
    { name: "D5", value: "D5" },
    { name: "D6", value: "D6" },
    { name: "D7", value: "D7" },
    { name: "D8", value: "D8" },
  ];

  private get _portTypes(): ConfigItemCollection[] {
    return [
      { name: this.lcn.localize("output"), value: this._outputPorts, id: "output" },
      { name: this.lcn.localize("relay"), value: this._relayPorts, id: "relay" },
      { name: this.lcn.localize("regulator"), value: this._regulators, id: "regulator-locks" },
      { name: this.lcn.localize("key"), value: this._keys, id: "key-locks" },
    ];
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._portType = this._portTypes[0];
    this._port = this._portType.value[0];
  }

  protected render() {
    if (!(this._portType || this._port)) {
      return nothing;
    }
    return html`
      <div id="port-type">${this.lcn.localize("port-type")}</div>

      <ha-formfield label=${this.lcn.localize("output")}>
        <ha-radio
          name="port"
          value="output"
          .checked=${this._portType.id === "output"}
          @change=${this._portTypeChanged}
        ></ha-radio>
      </ha-formfield>

      <ha-formfield label=${this.lcn.localize("relay")}>
        <ha-radio
          name="port"
          value="relay"
          .checked=${this._portType.id === "relay"}
          @change=${this._portTypeChanged}
        ></ha-radio>
      </ha-formfield>

      <ha-formfield label=${this.lcn.localize("regulator-lock")}>
        <ha-radio
          name="port"
          value="regulator-locks"
          .checked=${this._portType.id === "regulator-locks"}
          @change=${this._portTypeChanged}
        ></ha-radio>
      </ha-formfield>

      <ha-formfield label=${this.lcn.localize("key-lock")}>
        <ha-radio
          name="port"
          value="key-locks"
          .checked=${this._portType.id === "key-locks"}
          @change=${this._portTypeChanged}
        ></ha-radio>
      </ha-formfield>

      <ha-select
        id="port-select"
        .label=${this._portType.name}
        .value=${this._port.value}
        fixedMenuPosition
        @selected=${this._portChanged}
        @closed=${stopPropagation}
      >
        ${this._portType.value.map(
          (port) => html` <ha-list-item .value=${port.value}> ${port.name} </ha-list-item> `,
        )}
      </ha-select>
    `;
  }

  private _portTypeChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaRadio;

    this._portType = this._portTypes.find((portType) => portType.id === target.value)!;
    this._port = this._portType.value[0];
    this._portSelect.select(-1); // need to change index, so ha-select gets updated
  }

  private _portChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._port = this._portType.value.find((portType) => portType.value === target.value)!;
    this.domainData.output = this._port.value;
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyleDialog,
      css`
        #port-type {
          margin-top: 16px;
        }
        .lock-time {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 4px;
        }
        ha-select {
          display: block;
          margin-bottom: 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-switch-element": LCNConfigSwitchElement;
  }
}
