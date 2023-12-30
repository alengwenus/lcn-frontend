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
  CSSResult,
} from "lit";
import { customElement, property, query } from "lit/decorators";
import type { HaRadio } from "@ha/components/ha-radio";
import { haStyleDialog } from "@ha/resources/styles";
import { HomeAssistant } from "@ha/types";
import { ProgressDialog } from "./progress-dialog";
import { loadProgressDialog, showProgressDialog } from "./show-dialog-progress";
import { LcnDeviceDialogParams } from "./show-dialog-create-device";
import { LcnDeviceConfig } from "types/lcn";
import { fireEvent } from "@ha/common/dom/fire_event";
import { HaDialog } from "@ha/components/ha-dialog";

@customElement("lcn-create-device-dialog")
export class CreateDeviceDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() private _params?: LcnDeviceDialogParams;

  @property() private _isGroup = false;

  @property() private _segmentId = 0;

  @property() private _addressId = 5;

  @query("ha-dialog", true) private _dialog!: HaDialog;

  private _invalid = false;

  public async showDialog(params: LcnDeviceDialogParams): Promise<void> {
    this._params = params;
    await this.updateComplete;
    fireEvent(this._dialog as HTMLElement, "iron-resize");
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
      <ha-dialog open scrimClickAction heading="Create new module / group">
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

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        app-toolbar {
          color: var(--primary-text-color);
          background-color: var(--secondary-background-color);
          margin: 0;
          padding: 0 16px;
        }

        app-toolbar [main-title] {
          /* Design guideline states 24px, changed to 16 to align with state info */
          margin-left: 16px;
          line-height: 1.3em;
          max-height: 2.6em;
          overflow: hidden;
          /* webkit and blink still support simple multiline text-overflow */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
        }

        @media all and (min-width: 451px) and (min-height: 501px) {
          .main-title {
            pointer-events: auto;
            cursor: default;
          }
        }

        ha-dialog {
          width: 450px;
          max-height: none !important;
        }

        /* overrule the ha-style-dialog max-height on small screens */
        @media all and (max-width: 450px), all and (max-height: 500px) {
          app-toolbar {
            background-color: var(--app-header-background-color);
            color: var(--app-header-text-color, white);
          }
          ha-dialog {
            height: 100%;
            max-height: 100% !important;
            width: 100% !important;
            border-radius: 0px;
            position: fixed !important;
            margin: 0;
          }
          ha-dialog::before {
            content: "";
            position: fixed;
            z-index: -1;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            background-color: inherit;
          }
        }

        :host([rtl]) app-toolbar {
          direction: rtl;
          text-align: right;
        }
        :host {
          --paper-font-title_-_white-space: normal;
        }
      `,
      css`
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
