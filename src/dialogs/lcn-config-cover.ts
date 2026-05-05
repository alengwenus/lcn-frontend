import "@ha/components/ha-select";
import type { CSSResult, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, CoverConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-cover-element")
export class LCNConfigCoverElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public domainData!: CoverConfig;

  @state() private _motor!: ConfigItem;

  @state() private _positioningMode!: ConfigItem;

  @state() private _reverseDelay!: ConfigItem;

  private get _motors(): ConfigItem[] {
    return [
      { name: this.lcn.localize("motor-port", { port: 1 }), value: "MOTOR1" },
      { name: this.lcn.localize("motor-port", { port: 2 }), value: "MOTOR2" },
      { name: this.lcn.localize("motor-port", { port: 3 }), value: "MOTOR3" },
      { name: this.lcn.localize("motor-port", { port: 4 }), value: "MOTOR4" },
      { name: this.lcn.localize("outputs"), value: "OUTPUTS" },
    ];
  }

  private _reverseDelays: ConfigItem[] = [
    { name: "70ms", value: "RT70" },
    { name: "600ms", value: "RT600" },
    { name: "1200ms", value: "RT1200" },
  ];

  private get _positioningModes(): ConfigItem[] {
    return [
      { name: this.lcn.localize("motor-positioning-none"), value: "NONE" },
      { name: this.lcn.localize("motor-positioning-bs4"), value: "BS4" },
      { name: this.lcn.localize("motor-positioning-module"), value: "MODULE" },
    ];
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);

    if (!this._motor) {
      this._motor = this._motors[0];
      this._positioningMode = this._positioningModes[0];
      this._reverseDelay = this._reverseDelays[0];

      this.domainData = {
        motor: this._motor.value,
        positioning_mode: this._positioningMode.value,
        reverse_time: this._reverseDelay.value,
      };
    }
  }

  protected render() {
    if (!(this._motor || this._positioningMode || this._reverseDelay)) {
      return nothing;
    }
    return html`
      <ha-select
        id="motor-select"
        .label=${this.lcn.localize("motor")}
        .value=${this._motor.value}
        @selected=${this._motorChanged}
        .options=${this._motors.map((motor) => ({
          value: motor.value,
          label: motor.name,
        }))}
      ></ha-select>

      ${this._motor.value === "OUTPUTS"
        ? html`
            <ha-select
              id="reverse-delay-select"
              .label=${this.lcn.localize("reverse-delay")}
              .value=${this._reverseDelay.value}
              @selected=${this._reverseDelayChanged}
              .options=${this._reverseDelays.map((reverseDelay) => ({
                value: reverseDelay.value,
                label: reverseDelay.name,
              }))}
            ></ha-select>
          `
        : html`
            <ha-select
              id="positioning-mode-select"
              .label=${this.lcn.localize("motor-positioning-mode")}
              .value=${this._positioningMode.value}
              @selected=${this._positioningModeChanged}
              .options=${this._positioningModes.map((positioningMode) => ({
                value: positioningMode.value,
                label: positioningMode.name,
              }))}
            ></ha-select>
          `}
    `;
  }

  private _motorChanged(ev: ValueChangedEvent<string>): void {
    this._motor = this._motors.find((motor) => motor.value === ev.detail.value)!;
    this._positioningMode = this._positioningModes[0];
    this._reverseDelay = this._reverseDelays[0];
    this.domainData.motor = this._motor.value;
    if (this._motor.value === "OUTPUTS") this.domainData.positioning_mode = "NONE";
    else this.domainData.reverse_time = "RT1200";
  }

  private _positioningModeChanged(ev: ValueChangedEvent<string>): void {
    this._positioningMode = this._positioningModes.find(
      (positioningMode) => positioningMode.value === ev.detail.value,
    )!;
    this.domainData.positioning_mode = this._positioningMode.value;
  }

  private _reverseDelayChanged(ev: ValueChangedEvent<string>): void {
    this._reverseDelay = this._reverseDelays.find(
      (reverseDelay) => reverseDelay.value === ev.detail.value,
    )!;
    this.domainData.reverse_time = this._reverseDelay.value;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
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
    "lcn-config-cover-element": LCNConfigCoverElement;
  }
}
