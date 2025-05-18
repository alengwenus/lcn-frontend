import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import type { HaSelect } from "@ha/components/ha-select";
import type { CSSResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant } from "@ha/types";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
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

  @property({ attribute: false }) public domainData: CoverConfig = {
    motor: "MOTOR1",
    positioning_mode: "NONE",
    reverse_time: "RT1200",
  };

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

  public connectedCallback(): void {
    super.connectedCallback();
    this._motor = this._motors[0];
    this._positioningMode = this._positioningModes[0];
    this._reverseDelay = this._reverseDelays[0];
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
        fixedMenuPosition
        @selected=${this._motorChanged}
        @closed=${stopPropagation}
      >
        ${this._motors.map(
          (motor) => html` <ha-list-item .value=${motor.value}> ${motor.name} </ha-list-item> `,
        )}
      </ha-select>

      ${this._motor.value === "OUTPUTS"
        ? html`
            <ha-select
              id="reverse-delay-select"
              .label=${this.lcn.localize("reverse-delay")}
              .value=${this._reverseDelay.value}
              fixedMenuPosition
              @selected=${this._reverseDelayChanged}
              @closed=${stopPropagation}
            >
              ${this._reverseDelays.map(
                (reverseDelay) => html`
                  <ha-list-item .value=${reverseDelay.value}> ${reverseDelay.name} </ha-list-item>
                `,
              )}
            </ha-select>
          `
        : html`
            <ha-select
              id="positioning-mode-select"
              .label=${this.lcn.localize("motor-positioning-mode")}
              .value=${this._positioningMode.value}
              fixedMenuPosition
              @selected=${this._positioningModeChanged}
              @closed=${stopPropagation}
            >
              ${this._positioningModes.map(
                (positioningMode) => html`
                  <ha-list-item .value=${positioningMode.value}>
                    ${positioningMode.name}
                  </ha-list-item>
                `,
              )}
            </ha-select>
          `}
    `;
  }

  private _motorChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._motor = this._motors.find((motor) => motor.value === target.value)!;
    this._positioningMode = this._positioningModes[0];
    this._reverseDelay = this._reverseDelays[0];
    this.domainData.motor = this._motor.value;
    if (this._motor.value === "OUTPUTS") this.domainData.positioning_mode = "NONE";
    else this.domainData.reverse_time = "RT1200";
  }

  private _positioningModeChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._positioningMode = this._positioningModes.find(
      (positioningMode) => positioningMode.value === target.value,
    )!;
    this.domainData.positioning_mode = this._positioningMode.value;
  }

  private _reverseDelayChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._reverseDelay = this._reverseDelays.find(
      (reverseDelay) => reverseDelay.value === target.value,
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
