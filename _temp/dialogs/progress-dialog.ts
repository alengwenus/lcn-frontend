import "../../../../../../components/ha-circular-progress";
import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { haStyleDialog } from "@ha/resources/styles";
import { HomeAssistant } from "@ha/types";
import { ProgressDialogParams } from "./show-dialog-progress";
import { fireEvent } from "@ha/common/dom/fire_event";
import { HaDialog } from "@ha/components/ha-dialog";

@customElement("progress-dialog")
export class ProgressDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() private _params?: ProgressDialogParams;

  @query("ha-dialog", true) private _dialog!: HaDialog;

  public async showDialog(params: ProgressDialogParams): Promise<void> {
    this._params = params;
    await this.updateComplete;
    fireEvent(this._dialog as HTMLElement, "iron-resize");
  }

  public async closeDialog() {
    this.close();
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <ha-dialog open @close-dialog=${this.closeDialog}>
        <h2>${this._params?.title}</h2>
        <p>${this._params?.text}</p>

        <div id="dialog-content">
          <ha-circular-progress active></ha-circluar-progress>
        </div>
      </ha-dialog>
    `;
  }

  // public open() {
  //   this._dialog.open();
  // }

  public close() {
    this._params = undefined;
    // this._dialog.close();
  }

  static get styles(): CSSResult[] {
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
