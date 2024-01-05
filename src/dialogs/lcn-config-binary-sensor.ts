import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { LCN,  BinarySensorConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

interface ConfigItemCollection {
  name: string;
  value: ConfigItem[];
}

@customElement("lcn-config-binary-sensor-element")
export class LCNConfigBinarySensorElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public domainData: BinarySensorConfig = {
    source: "BINSENSOR1",
  };

  @property() private _sourceType = 0;

  @query("#sources-listbox") private _sourcesListBox;

  private get _binsensorPorts(): ConfigItem[] {
    const binary_sensor: string = this.lcn.localize("binary-sensor")
    return [
      { name: binary_sensor + " 1", value: "BINSENSOR1" },
      { name: binary_sensor + " 2", value: "BINSENSOR2" },
      { name: binary_sensor + " 3", value: "BINSENSOR3" },
      { name: binary_sensor + " 4", value: "BINSENSOR4" },
      { name: binary_sensor + " 5", value: "BINSENSOR5" },
      { name: binary_sensor + " 6", value: "BINSENSOR6" },
      { name: binary_sensor + " 7", value: "BINSENSOR7" },
      { name: binary_sensor + " 8", value: "BINSENSOR8" },
    ];
  };

  private get _setpoints(): ConfigItem[] {
    const setpoint: string = this.lcn.localize("setpoint")
    return [
      { name: setpoint + " 1", value: "R1VARSETPOINT" },
      { name: setpoint + " 2", value: "R2VARSETPOINT" },
    ];
  };

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

  private get _sourceTypes(): ConfigItemCollection[] {
    return [
      { name: this.lcn.localize("binary-sensor-type-binsensors"), value: this._binsensorPorts },
      { name: this.lcn.localize("binary-sensor-type-setpoint-locks"), value: this._setpoints },
      { name: this.lcn.localize("binary-sensor-type-keys-locks"), value: this._keys },
    ];
  };

  protected render(): TemplateResult {
    return html`
      <div class="sources">
        <paper-dropdown-menu
          label=${this.lcn.localize("source-type")}
          .value=${this._sourceTypes[this._sourceType].name}
        >
          <paper-listbox
            id="sources-type-listbox"
            slot="dropdown-content"
            @selected-changed=${this._sourceTypeChanged}
          >
            ${this._sourceTypes.map(
              (sourceType) => html`
                <paper-item .itemValue=${sourceType.value}
                  >${sourceType.name}</paper-item
                >
              `
            )}
        </paper-dropdown-menu>

        <paper-dropdown-menu
          label=${this.lcn.localize("source")}
          .value=${this._sourceTypes[this._sourceType].value[0].name}
        >
          <paper-listbox
            id="sources-listbox"
            slot="dropdown-content"
            @selected-changed=${this._sourceChanged}
          >
            ${this._sourceTypes[this._sourceType].value.map(
              (source) => html`
                <paper-item .itemValue=${source.value}
                  >${source.name}</paper-item
                >
              `
            )}
        </paper-dropdown-menu>
      </div>
      `;
  }

  private _sourceTypeChanged(ev: CustomEvent): void {
    this._sourceType = ev.detail.value;
    this._sourcesListBox.selectIndex(0);
    const source =
      this._sourceTypes[this._sourceType].value[this._sourcesListBox.selected];
    this.domainData.source = source.value;
  }

  private _sourceChanged(ev: CustomEvent): void {
    const source = this._sourceTypes[this._sourceType].value[ev.detail.value];
    this.domainData.source = source.value;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        .sources > * {
          display: block;
          margin-top: 16px;
        }
        #sources-type-listbox {
          width: 175px;
        }
        #sources-listbox {
          width: 175px;
        }
      `,
    ];
  }
}
