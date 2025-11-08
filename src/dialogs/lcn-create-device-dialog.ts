import "@ha/components/ha-button";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import "@ha/components/ha-textfield";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { PropertyValues, CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
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

  @state() private _params?: LcnDeviceDialogParams;

  @state() private _isGroup = false;

  @state() private _segmentId = 0;

  @state() private _addressId = 5;

  @state() private _invalid = false;

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
    if (changedProperties.has("_invalid")) {
      this._invalid =
        !this._validateSegmentId(this._segmentId) ||
        !this._validateAddressId(this._addressId, this._isGroup);
    }
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
        ) as unknown as string}
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
          .value=${this._segmentId.toString()}
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
          .value=${this._addressId.toString()}
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
          <ha-button slot="secondaryAction" @click=${this._closeDialog}>
            ${this.lcn.localize("dismiss")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${this._create} .disabled=${this._invalid}>
            ${this.lcn.localize("create")}
          </ha-button>
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

  private _validateSegmentId(segmentId: number): boolean {
    // segement_id: 0, 5-128
    return segmentId === 0 || (segmentId >= 5 && segmentId <= 128);
  }

  private _validateAddressId(addressId: number, isGroup: boolean): boolean {
    // module_id: 5-254
    // group_id: 5-254
    if (isGroup) {
      return addressId >= 5 && addressId <= 254;
    }
    return addressId >= 5 && addressId <= 254;
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
