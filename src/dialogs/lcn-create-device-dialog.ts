import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-input/paper-input";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import {
  css,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
  CSSResultGroup
} from "lit";
import { customElement, property } from "lit/decorators";
import { createCloseHeading } from "@ha/components/ha-dialog";
import type { HaRadio } from "@ha/components/ha-radio";
import { haStyleDialog } from "@ha/resources/styles";
import { HomeAssistant } from "@ha/types";
import { loadProgressDialog } from "./show-dialog-progress";
import { LcnDeviceDialogParams } from "./show-dialog-create-device";
import { LCN, LcnDeviceConfig } from "types/lcn";

@customElement("lcn-create-device-dialog")
export class CreateDeviceDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() private _params?: LcnDeviceDialogParams;

  @property() private _isGroup = false;

  @property() private _segmentId = 0;

  @property() private _addressId = 5;

  private _invalid = false;

  public async showDialog(params: LcnDeviceDialogParams): Promise<void> {
    this._params = params;
    this.lcn = params.lcn;
    await this.updateComplete;
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    loadProgressDialog();
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid =
      this._validateSegmentId(this._segmentId) ||
      this._validateAddressId(this._addressId, this._isGroup);
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <ha-dialog
        open
        .heading=${createCloseHeading(
          this.hass,
          this.lcn.localize("dashboard-devices-dialog-create-title")
        )}
        @closed=${this._closeDialog}

      >
        <form>
          <div>${this.lcn.localize("type")}</div>
          <ha-formfield
            label=${this.lcn.localize("module")}>
            <ha-radio
              name="is_group"
              value="module"
              .checked=${this._isGroup === false}
              @change=${this._isGroupChanged}
            ></ha-radio>
          </ha-formfield>
          <ha-formfield
            label=${this.lcn.localize("group")}>
            <ha-radio
              name="is_group"
              value="group"
              .checked=${this._isGroup === true}
              @change=${this._isGroupChanged}
            ></ha-radio>
          </ha-formfield>

          <paper-input
            label=${this.lcn.localize("segment-id")}
            type="number"
            value="0"
            min="0"
            @value-changed=${this._segmentIdChanged}
            }}
            .invalid=${this._validateSegmentId(this._segmentId)}
            error-message=${this.lcn.localize("dashboard-devices-dialog-error-segment")}
          >
          </paper-input>
          <paper-input
            label=${this.lcn.localize("id")}
            type="number"
            value="5"
            min="0"
            @value-changed=${this._addressIdChanged}
            .invalid=${this._validateAddressId(this._addressId, this._isGroup)}
            error-message=${this._isGroup
        ? this.lcn.localize("dashboard-devices-dialog-error-segment")
        : this.lcn.localize("dashboard-devices-dialog-error-segment")}
          >
          </paper-input>
        </form>

        <div class="buttons">
          <mwc-button
            slot="secondaryAction"
            @click=${this._closeDialog}
            .label=${this.lcn.localize("dismiss")}
          ></mwc-button>
          <mwc-button
            slot="primaryAction"
            @click=${this._create}
            .disabled=${this._invalid}
            .label=${this.lcn.localize("create")}
          ></mwc-button>
        </div>
      </ha-dialog>
    `;
  }

  private _isGroupChanged(ev: CustomEvent): void {
    this._isGroup = (ev.target as HaRadio).value === "group";
  }

  private _segmentIdChanged(ev: CustomEvent): void {
    this._segmentId = +ev.detail.value;
  }

  private _addressIdChanged(ev: CustomEvent): void {
    this._addressId = +ev.detail.value;
  }

  private _validateSegmentId(segment_id: number): boolean {
    // segement_id: 0, 5-128
    return !(segment_id === 0 || (segment_id >= 5 && segment_id <= 128));
  }

  private _validateAddressId(address_id: number, is_group: boolean): boolean {
    // module_id: 5-254
    // group_id: 3-254
    if (is_group) {
      return !(address_id >= 5 && address_id <= 254);
    }
    return !(address_id >= 5 && address_id <= 254);
  }

  private async _create(): Promise<void> {
    const values: Partial<LcnDeviceConfig> = {
      name: "",
      address: [this._segmentId, this._addressId, this._isGroup],
    };
    await this._params!.createDevice(values);
    this._closeDialog();
  }

  private _closeDialog(): void {
    this._params = undefined;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        .form {
          padding-bottom: 24px;
        }
        .buttons {
          display: flex;
          justify-content: space-between;
          padding: 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-create-device-dialog": CreateDeviceDialog;
  }
}
