import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiPlus } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import "@ha/layouts/hass-tabs-subpage";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-fab";
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
import { ConfigEntry } from "@ha/data/config_entries";
import {
  loadLCNCreateEntityDialog,
  showLCNCreateEntityDialog,
} from "./dialogs/show-dialog-create-entity";

@customElement("lcn-entities-page")
export class LCNEntitiesPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Array, reflect: false }) public tabs: PageNavigation[] = [];

  @state() private _deviceConfig!: LcnDeviceConfig;

  @state() private _entityConfigs: LcnEntityConfig[] = [];

  protected async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    loadLCNCreateEntityDialog();

    await this._fetchEntities(this.lcn.config_entry, this.lcn.address);
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
        .tabs=${this.tabs}
      >
        <span slot="header"> ${this.lcn.localize("dashboard-entities-title")} </span>
        <ha-config-section .narrow=${this.narrow}>
          <span slot="introduction"> ${this.renderIntro()} </span>

          <ha-card
            header="${this._deviceConfig.address[2]
              ? this.lcn.localize("dashboard-entities-entities-for-group")
              : this.lcn.localize("dashboard-entities-entities-for-module")}:
              (${this.lcn.config_entry.title}, ${this._deviceConfig.address[0]},
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
          .label=${this.lcn.localize("dashboard-entities-add")}
          extended
        >
          <ha-svg-icon slot="icon" path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
      </hass-tabs-subpage>
    `;
  }

  private renderIntro(): TemplateResult {
    return html`
      <h3>${this.lcn.localize("dashboard-entities-introduction")}</h3>
      <details>
        <summary>${this.lcn.localize("more-help")}</summary>
        <ul>
          <li>${this.lcn.localize("dashboard-entities-introduction-help-1")}</li>
          <li>${this.lcn.localize("dashboard-entities-introduction-help-2")}</li>
          <li>${this.lcn.localize("dashboard-entities-introduction-help-3")}</li>
          <li>${this.lcn.localize("dashboard-entities-introduction-help-4")}</li>
          <li>${this.lcn.localize("dashboard-entities-introduction-help-5")}</li>
        </ul>
      </details>
    `;
  }

  private _configurationChanged() {
    this._fetchEntities(this.lcn.config_entry, this.lcn.address);
  }

  private async _fetchEntities(config_entry: ConfigEntry, address: LcnAddress) {
    const deviceConfigs = await fetchDevices(this.hass!, config_entry);
    const deviceConfig = deviceConfigs.find(
      (el) =>
        el.address[0] === address[0] &&
        el.address[1] === address[1] &&
        el.address[2] === address[2],
    );
    if (deviceConfig !== undefined) {
      this._deviceConfig = deviceConfig;
    }
    this._entityConfigs = await fetchEntities(this.hass!, config_entry, address);
  }

  private async _addEntity() {
    showLCNCreateEntityDialog(this, {
      lcn: this.lcn,
      device: <LcnDeviceConfig>this._deviceConfig,
      createEntity: async (entityParams) => {
        if (await addEntity(this.hass, this.lcn.config_entry, entityParams)) {
          await this._fetchEntities(this.lcn.config_entry, this.lcn.address);
          return true;
        }
        return false;
      },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-entities-page": LCNEntitiesPage;
  }
}
