import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import type { HaSelect } from "@ha/components/ha-select";
import { css, html, LitElement, CSSResult, nothing } from "lit";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import { customElement, property, query, state } from "lit/decorators";
import type { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, BinarySensorConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

interface ConfigItemCollection {
  name: string;
  value: ConfigItem[];
  id: string;
}

@customElement("lcn-config-binary-sensor-element")
export class LCNConfigBinarySensorElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public domainData: BinarySensorConfig = {
    source: "BINSENSOR1",
  };

  @state() private _sourceType!: ConfigItemCollection;

  @state() private _source!: ConfigItem;

  @query("#source-select") private _sourceSelect!: HaSelect;

  private get _binsensorPorts(): ConfigItem[] {
    const binary_sensor: string = this.lcn.localize("binary-sensor");
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

  private get _sourceTypes(): ConfigItemCollection[] {
    return [
      {
        name: this.lcn.localize("binsensors"),
        value: this._binsensorPorts,
        id: "binsensors",
      },
      {
        name: this.lcn.localize("regulator-locks"),
        value: this._regulators,
        id: "regulator-locks",
      },
      {
        name: this.lcn.localize("key-locks"),
        value: this._keys,
        id: "key-locks",
      },
    ];
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._sourceType = this._sourceTypes[0];
    this._source = this._sourceType.value[0];
  }

  protected render() {
    if (!(this._sourceType || this._source)) {
      return nothing;
    }
    return html`
      <div class="sources">
        <ha-select
          id="source-type-select"
          .label=${this.lcn.localize("source-type")}
          .value=${this._sourceType.id}
          fixedMenuPosition
          @selected=${this._sourceTypeChanged}
          @closed=${stopPropagation}
        >
          ${this._sourceTypes.map(
            (sourceType) => html`
              <ha-list-item .value=${sourceType.id}> ${sourceType.name} </ha-list-item>
            `,
          )}
        </ha-select>

        <ha-select
          id="source-select"
          .label=${this.lcn.localize("source")}
          .value=${this._source.value}
          fixedMenuPosition
          @selected=${this._sourceChanged}
          @closed=${stopPropagation}
        >
          ${this._sourceType.value.map(
            (source) => html`
              <ha-list-item .value=${source.value}> ${source.name} </ha-list-item>
            `,
          )}
        </ha-select>
      </div>
    `;
  }

  private _sourceTypeChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._sourceType = this._sourceTypes.find((sourceType) => sourceType.id === target.value)!;
    this._source = this._sourceType.value[0];
    this._sourceSelect.select(-1); // need to change index, so ha-select gets updated
  }

  private _sourceChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._source = this._sourceType.value.find((source) => source.value === target.value)!;
    this.domainData.source = this._source.value;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        .sources {
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
    "lcn-config-binary-sensor-element": LCNConfigBinarySensorElement;
  }
}
