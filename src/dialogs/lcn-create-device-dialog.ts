import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import "@ha/components/ha-textfield";
import { fireEvent } from "@ha/common/dom/fire_event";
import { css, html, LitElement, PropertyValues, CSSResultGroup, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import { createCloseHeading } from "@ha/components/ha-dialog";
import type { HaRadio } from "@ha/components/ha-radio";
import { haStyleDialog } from "@ha/resources/styles";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import type { LCN, LcnDeviceConfig } from "types/lcn";
import type { HaTextField } from "@ha/components/ha-textfield";
import { loadProgressDialog } from "./show-dialog-progress";
import type { LcnDeviceDialogParams } from "./show-dialog-create-device";

@customElement("lcn-create-device-dialog")
export class CreateDeviceDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() private _params?: LcnDeviceDialogParams;

  @property() private _isGroup: boolean = false;

  @property() private _segmentId: number = 0;

  @property() private _addressId: number = 5;

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
      !this._validateSegmentId(this._segmentId) ||
      !this._validateAddressId(this._addressId, this._isGroup);
  }

  protected render() {
    if (!this._params) {
      return nothing;
    }
    return html`
      <ha-dialog
        open
        scrimClickAction
        escapeKeyAction
        .heading=${createCloseHeading(
          this.hass,
          this.lcn.localize("dashboard-devices-dialog-create-title"),
        )}
        @closed=${this._closeDialog}
      >
        <div id="type">${this.lcn.localize("type")}</div>

        <ha-formfield label=${this.lcn.localize("module")}>
          <ha-radio
            name="is_group"
            value="module"
            .checked=${this._isGroup === false}
            @change=${this._isGroupChanged}
          ></ha-radio>
        </ha-formfield>

        <ha-formfield label=${this.lcn.localize("group")}>
          <ha-radio
            name="is_group"
            value="group"
            .checked=${this._isGroup === true}
            @change=${this._isGroupChanged}
          ></ha-radio>
        </ha-formfield>

        <ha-textfield
          .label=${this.lcn.localize("segment-id")}
          type="number"
          .value=${this._segmentId}
          min="0"
          required
          autoValidate
          @input=${this._segmentIdChanged}
          .validityTransform=${this._validityTransformSegmentId}
          .validationMessage=${this.lcn.localize("dashboard-devices-dialog-error-segment")}
        ></ha-textfield>

        <ha-textfield
          .label=${this.lcn.localize("id")}
          type="number"
          .value=${this._addressId}
          min="0"
          required
          autoValidate
          @input=${this._addressIdChanged}
          .validityTransform=${this._validityTransformAddressId}
          .validationMessage=${this._isGroup
            ? this.lcn.localize("dashboard-devices-dialog-error-group")
            : this.lcn.localize("dashboard-devices-dialog-error-module")}
        ></ha-textfield>

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

  private _isGroupChanged(ev: ValueChangedEvent<string>): void {
    this._isGroup = (ev.target as HaRadio).value === "group";
  }

  private _segmentIdChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this._segmentId = +target.value;
  }

  private _addressIdChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this._addressId = +target.value;
  }

  private _validateSegmentId(segment_id: number): boolean {
    // segement_id: 0, 5-128
    return segment_id === 0 || (segment_id >= 5 && segment_id <= 128);
  }

  private _validateAddressId(address_id: number, is_group: boolean): boolean {
    // module_id: 5-254
    // group_id: 5-254
    if (is_group) {
      return address_id >= 5 && address_id <= 254;
    }
    return address_id >= 5 && address_id <= 254;
  }

  private get _validityTransformSegmentId() {
    return (value: string) => ({ valid: this._validateSegmentId(+value) });
  }

  private get _validityTransformAddressId() {
    return (value: string) => ({ valid: this._validateAddressId(+value, this._isGroup) });
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
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        #port-type {
          margin-top: 16px;
        }
        ha-textfield {
          display: block;
          margin-bottom: 8px;
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
