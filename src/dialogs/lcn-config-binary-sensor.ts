import "@ha/components/ha-md-select";
import "@ha/components/ha-md-select-option";
import type { HaMdSelect } from "@ha/components/ha-md-select";
import type { CSSResult, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import { customElement, property, query, state } from "lit/decorators";
import type { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, BinarySensorConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-binary-sensor-element")
export class LCNConfigBinarySensorElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public domainData: BinarySensorConfig = {
    source: "BINSENSOR1",
  };

  @state() private _source!: ConfigItem;

  @query("#source-select") private _sourceSelect!: HaMdSelect;

  private get _sources(): ConfigItem[] {
    const binarySensor: string = this.lcn.localize("binary-sensor");
    return [
      { name: binarySensor + " 1", value: "BINSENSOR1" },
      { name: binarySensor + " 2", value: "BINSENSOR2" },
      { name: binarySensor + " 4", value: "BINSENSOR4" },
      { name: binarySensor + " 3", value: "BINSENSOR3" },
      { name: binarySensor + " 5", value: "BINSENSOR5" },
      { name: binarySensor + " 6", value: "BINSENSOR6" },
      { name: binarySensor + " 7", value: "BINSENSOR7" },
      { name: binarySensor + " 8", value: "BINSENSOR8" },
    ];
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._source = this._sources[0];
  }

  protected async updated(changedProperties: PropertyValues) {
    if (changedProperties.has("_sourceType")) {
      this._sourceSelect.selectIndex(0);
    }
    super.updated(changedProperties);
  }

  protected render() {
    if (!this._source) {
      return nothing;
    }
    return html`
      <div class="sources">
        <ha-md-select
          id="source-select"
          .label=${this.lcn.localize("source")}
          .value=${this._source.value}
          @change=${this._sourceChanged}
          @closed=${stopPropagation}
        >
          ${this._sources.map(
            (source) => html`
              <ha-md-select-option .value=${source.value}> ${source.name} </ha-md-select-option>
            `,
          )}
        </ha-md-select>
      </div>
    `;
  }

  private _sourceChanged(ev: CustomEvent): void {
    const target = ev.target as HaMdSelect;
    if (target.selectedIndex === -1) return;

    this._source = this._sources.find((source) => source.value === target.value)!;
    this.domainData.source = this._source.value;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        ha-md-select {
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
