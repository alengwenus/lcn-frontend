import "@ha/components/ha-spinner";
import type { CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { haStyleDialog } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";
import { fireEvent } from "@ha/common/dom/fire_event";
import "@ha/components/ha-wa-dialog";
import "@ha/components/ha-dialog-footer";
import type { ProgressDialogParams } from "./show-dialog-progress";

@customElement("progress-dialog")
export class ProgressDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _params?: ProgressDialogParams;

  @state() private _open = false;

  public async showDialog(params: ProgressDialogParams): Promise<void> {
    this._params = params;
    this._open = true;
  }

  private _dialogClosed() {
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  public closeDialog(): void {
    this._open = false;
  }

  protected render() {
    if (!this._params) {
      return nothing;
    }
    return html`
      <ha-wa-dialog
        .open=${this._open}
        header-title=${this._params.title}
        @close-dialog=${this._dialogClosed}
      >
        ${this._params?.text}

        <div id="dialog-content">
          <ha-spinner></ha-spinner>
        </div>
      </ha-wa-dialog>
    `;
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyleDialog,
      css`
        #dialog-content {
          text-align: center;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "progress-dialog": ProgressDialog;
  }
}
