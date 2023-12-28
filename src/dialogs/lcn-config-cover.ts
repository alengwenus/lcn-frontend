import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { CoverConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-cover-element")
export class LCNConfigCoverElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public software_serial = -1;

  @property() public domainData: CoverConfig = {
    motor: "MOTOR1",
    reverse_time: "RT1200",
  };

  @query("#motors-listbox") private _motorsListBox;

  @query("#reverse-times-listbox") private _reverseTimesListBox;

  private _motors: ConfigItem[] = [
    { name: "Motor 1", value: "MOTOR1" },
    { name: "Motor 2", value: "MOTOR2" },
    { name: "Motor 3", value: "MOTOR3" },
    { name: "Motor 4", value: "MOTOR4" },
    { name: "Outputs", value: "OUTPUTS" },
  ];

  private _reverseTimes: ConfigItem[] = [
    { name: "70ms", value: "RT70" },
    { name: "600ms", value: "RT600" },
    { name: "1200ms", value: "RT1200" },
  ];

  protected render(): TemplateResult {
    return html`
      <form>
        <paper-dropdown-menu label="Motor" .value=${this._motors[0].name}>
          <paper-listbox
            id="motors-listbox"
            slot="dropdown-content"
            @selected-item-changed=${this._motorChanged}
          >
            ${this._motors.map(
              (motor) => html`
                <paper-item .itemValue=${motor.value}>${motor.name}</paper-item>
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        ${this.domainData.motor === "OUTPUTS"
          ? html`
              <paper-dropdown-menu
                label="Reverse time"
                .value=${this._reverseTimes[0].name}
              >
                <paper-listbox
                  id="reverse-times-listbox"
                  slot="dropdown-content"
                  @selected-item-changed=${this._reverseTimeChanged}
                >
                  ${this._reverseTimes.map(
                    (rt) => html`
                      <paper-item .itemValue=${rt.value}>${rt.name}</paper-item>
                    `
                  )}
                </paper-listbox>
              </paper-dropdown-menu>
            `
          : html``}
      </form>
    `;
  }

  private _motorChanged(ev: CustomEvent): void {
    if (!ev.detail.value) {
      return;
    }
    const motor = this._motors[this._motorsListBox.selected];
    this.domainData.motor = motor.value;
    this.requestUpdate();
  }

  private _reverseTimeChanged(ev: CustomEvent): void {
    if (!ev.detail.value) {
      return;
    }
    const reverseTime = this._reverseTimes[this._reverseTimesListBox.selected];
    this.domainData.reverse_time = reverseTime.value;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #motors-listbox {
          width: 120px;
        }
        #reverse-times-listbox {
          width: 120px;
        }
      `,
    ];
  }
}
