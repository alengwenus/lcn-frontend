import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import { HaSelect } from "@ha/components/ha-select";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { css, html, LitElement, TemplateResult, CSSResult, PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { LCN, CoverConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-cover-element")
export class LCNConfigCoverElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public software_serial = -1;

  @property() public domainData: CoverConfig = {
    motor: "MOTOR1",
    reverse_time: "RT1200",
  };

  @property() private _motor!: ConfigItem;

  @property() private _reverseDelay!: ConfigItem;

  @query("#reverse-delay-select") private _reverseDelaySelect;

  private get _motors(): ConfigItem[] {
    const motor: string = this.lcn.localize("motor");
    return [
      { name: motor + " 1", value: "MOTOR1" },
      { name: motor + " 2", value: "MOTOR2" },
      { name: motor + " 3", value: "MOTOR3" },
      { name: motor + " 4", value: "MOTOR4" },
      { name: this.lcn.localize("outputs"), value: "OUTPUTS" },
    ];
  }

  private _reverseDelays: ConfigItem[] = [
    { name: "70ms", value: "RT70" },
    { name: "600ms", value: "RT600" },
    { name: "1200ms", value: "RT1200" },
  ];

  protected async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this._motor = this._motors[0];
    this._reverseDelay = this._reverseDelays[0];
  }

  protected render(): TemplateResult {
    if (!(this._motor || this._reverseDelay)) {
      return html``;
    }
    return html`
      <ha-select
        id="motor-select"
        .label=${this.lcn.localize("motor")}
        .value=${this._motor.value}
        fixedMenuPosition
        @selected=${this._motorChanged}
        @closed=${(ev: CustomEvent) => ev.stopPropagation()}
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
              @closed=${(ev: CustomEvent) => ev.stopPropagation()}
            >
              ${this._reverseDelays.map(
                (reverseDelay) => html`
                  <ha-list-item .value=${reverseDelay.value}> ${reverseDelay.name} </ha-list-item>
                `,
              )}
            </ha-select>
          `
        : html``}
    `;
  }

  private _motorChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index == -1) return;

    this._motor = this._motors.find((motor) => motor.value == target.value)!;
    this._reverseDelay = this._reverseDelays[0];
    this.domainData.motor = this._motor.value;
  }

  private _reverseDelayChanged(ev: CustomEvent): void {
    const target = ev.target as HaSelect;
    if (target.index == -1) return;

    this._reverseDelay = this._reverseDelays.find(
      (reverseDelay) => reverseDelay.value == target.value,
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
