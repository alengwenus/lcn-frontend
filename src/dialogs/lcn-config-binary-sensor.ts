import "@ha/components/ha-select";
import type { CSSResult, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
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

  @property({ attribute: false }) public domainData!: BinarySensorConfig;

  @state() private _source!: ConfigItem;

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

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);

    if (!this._source) {
      this._source = this._sources[0];

      this.domainData = { source: this._source.value };
    }
  }

  protected render() {
    if (!this._source) {
      return nothing;
    }
    return html`
      <div class="sources">
        <ha-select
          id="source-select"
          .label=${this.lcn.localize("source")}
          .value=${this._source.value}
          @selected=${this._sourceChanged}
          .options=${this._sources.map((source) => ({
            value: source.value,
            label: source.name,
          }))}
        ></ha-select>
      </div>
    `;
  }

  private _sourceChanged(ev: ValueChangedEvent<string>): void {
    ev.stopPropagation();
    this._source = this._sources.find((source) => source.value === ev.detail.value)!;
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
