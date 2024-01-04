import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property } from "lit/decorators";
import { mdiPlus } from "@mdi/js";
import { HomeAssistant, Route } from "@ha/types";
import "@ha/layouts/hass-tabs-subpage";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-fab"
import { haStyle } from "@ha/resources/styles";
import "./lcn-entities-data-table";
import {
  LCN,
  fetchEntities,
  fetchDevices,
  addEntity,
  LcnDeviceConfig,
  LcnEntityConfig,
  LcnAddress,
} from "types/lcn";
import {
  loadLCNCreateEntityDialog,
  showLCNCreateEntityDialog,
} from "./dialogs/show-dialog-create-entity";
import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";


@customElement("lcn-entities-page")
export class LCNEntitiesPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @property({ type: Array, reflect: false }) public tabs: PageNavigation[] = [];

  @property() private _deviceConfig!: LcnDeviceConfig;

  @property() private _entityConfigs: LcnEntityConfig[] = [];

  protected async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    loadLCNCreateEntityDialog();

    await this._fetchEntities(this.lcn.host.id, this.lcn.address);
  }

  protected render(): TemplateResult {
    if (!this._deviceConfig && this._entityConfigs.length === 0) {
      return html` <hass-loading-screen></hass-loading-screen> `;
    }
    return html`
      <hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .route=${this.route}
        back-path="/lcn/devices"
        .tabs=${this.tabs}
      >
        <ha-config-section
          .narrow=${this.narrow} >
          <span slot="header"> Device configuration </span>

          <span slot="introduction"> Configure entities for this device. </span>

          <ha-card
            header="Entities for ${this._deviceConfig.address[2]
              ? "group"
              : "module"}
              (${this.lcn.host.name}, ${this._deviceConfig.address[0]},
              ${this._deviceConfig.address[1]})
              ${this._deviceConfig.name ? " - " + this._deviceConfig.name : ""}
            "
          >
            <lcn-entities-data-table
              .hass=${this.hass}
              .lcn=${this.lcn}
              .entities=${this._entityConfigs}
              .device=${this._deviceConfig}
              .narrow=${this.narrow}
              @lcn-configuration-changed=${this._configurationChanged}
            ></lcn-entities-data-table>
          </ha-card>

        </ha-config-section>
        <ha-fab
          slot="fab"
          @click=${this._addEntity}
          .label=${this.lcn.localize("config-entities-add")}
          extended
        >
          <ha-svg-icon slot="icon" path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
      </hass-tabs-subpage>
    `;
  }

  private _configurationChanged() {
    this._fetchEntities(this.lcn.host.id, this.lcn.address);
  }

  private async _fetchEntities(host: string, address: LcnAddress) {
    const deviceConfigs = await fetchDevices(this.hass!, host);
    const deviceConfig = deviceConfigs.find((el) => el.address[0] === address[0] && el.address[1] === address[1] && el.address[2] === address[2]);
    if (deviceConfig !== undefined) {
      this._deviceConfig = deviceConfig;
    };
    this._entityConfigs = await fetchEntities(this.hass!, host, address);
  }

  private async _addEntity() {
    showLCNCreateEntityDialog(this, {
      device: <LcnDeviceConfig>this._deviceConfig,
      createEntity: async (entityParams) => {
        if (!(await addEntity(this.hass, this.lcn.host.id, entityParams))) {
          await showAlertDialog(this, {
            title: "LCN resource already assigned",
            text: `The specified LCN resource is already
                   assigned to an entity within the ${entityParams.domain}-domain.
                   LCN resources may only be assigned once within a domain.`,
          });
          return;
        }
        await this._fetchEntities(this.lcn.host.id, this.lcn.address);
      },
    });
  }

  // static get styles(): CSSResult[] {
  //   return [
  //     haStyle,
  //     css`
  //     `,
  //   ];
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-entities-page": LCNEntitiesPage;
  }
}
