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
import { ProgressDialog } from "./progress-dialog";
import { loadProgressDialog, showProgressDialog } from "./show-dialog-progress";
import { LcnDeviceDialogParams } from "./show-dialog-create-device";
import { LcnDeviceConfig } from "types/lcn";

@customElement("lcn-create-device-dialog")
export class CreateDeviceDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() private _params?: LcnDeviceDialogParams;

  @property() private _isGroup = false;

  @property() private _segmentId = 0;

  @property() private _addressId = 5;

  private _invalid = false;

  public async showDialog(params: LcnDeviceDialogParams): Promise<void> {
    console.log("showDialog");
    this._params = params;
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
          "Create new module / group"
        )}
        @closed=${this._closeDialog}

      >
        <form>
          <div>Type:</div>
          <ha-formfield label="Module">
            <ha-radio
              name="is_group"
              value="module"
              .checked=${this._isGroup === false}
              @change=${this._isGroupChanged}
            ></ha-radio>
          </ha-formfield>
          <ha-formfield label="Group">
            <ha-radio
              name="is_group"
              value="group"
              .checked=${this._isGroup === true}
              @change=${this._isGroupChanged}
            ></ha-radio>
          </ha-formfield>

          <paper-input
            label="Segment ID"
            type="number"
            value="0"
            min="0"
            @value-changed=${this._segmentIdChanged}
            }}
            .invalid=${this._validateSegmentId(this._segmentId)}
            error-message="Segment ID must be 0, 5..128."
          >
          </paper-input>
          <paper-input
            label="ID"
            type="number"
            value="5"
            min="0"
            @value-changed=${this._addressIdChanged}
            .invalid=${this._validateAddressId(this._addressId, this._isGroup)}
            error-message=${this._isGroup
        ? "Group ID must be 3..254."
        : "Module ID must be 5..254"}
          >
          </paper-input>
        </form>

        <div class="buttons">
          <mwc-button @click=${this._closeDialog} slot="secondaryAction">
            Dismiss
          </mwc-button>
          <mwc-button
            @click=${this._create}
            .disabled=${this._invalid}
            slot="primaryAction"
          >
            Create
          </mwc-button>
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
      return !(address_id >= 3 && address_id <= 254);
    }
    return !(address_id >= 5 && address_id <= 254);
  }

  private async _create(): Promise<void> {
    const values: Partial<LcnDeviceConfig> = {
      name: "",
      address: [this._segmentId, this._addressId, this._isGroup],
    };

    const dialog: () => ProgressDialog | undefined = showProgressDialog(this, {
      title: "Requesting device info from LCN",
      text: html`
        The information for the specified device is beeing requested from LCN.
        This might take several seconds.<br />
        This dialog will close automatically.
      `,
    });

    await this._params!.createDevice(values);
    dialog()!.closeDialog();

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
