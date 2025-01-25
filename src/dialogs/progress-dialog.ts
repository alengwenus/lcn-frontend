import "@ha/components/ha-circular-progress";
import type { CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { haStyleDialog } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { HaDialog } from "@ha/components/ha-dialog";
import type { ProgressDialogParams } from "./show-dialog-progress";

@customElement("progress-dialog")
export class ProgressDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _params?: ProgressDialogParams;

  @query("ha-dialog", true) private _dialog!: HaDialog;

  public async showDialog(params: ProgressDialogParams): Promise<void> {
    this._params = params;
    await this.updateComplete;
    fireEvent(this._dialog as HTMLElement, "iron-resize");
  }

  public async closeDialog() {
    this.close();
  }

  protected render() {
    if (!this._params) {
      return nothing;
    }
    return html`
      <ha-dialog open scrimClickAction escapeKeyAction @close-dialog=${this.closeDialog}>
        <h2>${this._params?.title}</h2>
        <p>${this._params?.text}</p>

        <div id="dialog-content">
          <ha-circular-progress active></ha-circular-progress>
        </div>
      </ha-dialog>
    `;
  }

  public close() {
    this._params = undefined;
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
