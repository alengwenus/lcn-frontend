import { haStyle } from "@ha/resources/styles";
import { css, html, LitElement, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiPlus, mdiDelete } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import "@ha/layouts/hass-tabs-subpage";
import memoizeOne from "memoize-one";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import { storage } from "@ha/common/decorators/storage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-fab";
import {
  LCN,
  fetchEntities,
  fetchDevices,
  addEntity,
  deleteEntity,
  LcnDeviceConfig,
  LcnEntityConfig,
  LcnAddress,
} from "types/lcn";
import { ConfigEntry } from "@ha/data/config_entries";
import type { HASSDomEvent } from "@ha/common/dom/fire_event";
import type {
  DataTableColumnContainer,
  SelectionChangedEvent,
  SortingChangedEvent,
} from "@ha/components/data-table/ha-data-table";
import { addressToString, stringToAddress } from "helpers/address_conversion";
import {
  loadLCNCreateEntityDialog,
  showLCNCreateEntityDialog,
} from "./dialogs/show-dialog-create-entity";

interface EntityRowData extends LcnEntityConfig {
  unique_id: string;
  delete: LcnEntityConfig;
};


function createUniqueEntityId(entity: LcnEntityConfig): string {
  return `${addressToString(entity.address)}/${entity.domain}/${entity.resource}`
}

function parseUniqueEntityId(unique_id: string):
    { address: LcnAddress; domain: string; resource: string } {
  const splitted = unique_id.split("/");
  const resource = splitted.pop()!;
  const domain = splitted.pop()!;
  const address_str = splitted.pop();
  const address = stringToAddress(address_str!);
  const result = { address: address, domain: domain, resource: resource };
  return result
}


@customElement("lcn-entities-page")
export class LCNEntitiesPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Array, reflect: false }) public tabs: PageNavigation[] = [];

  @state() private _deviceConfig!: LcnDeviceConfig;

  @state() private entityConfigs: LcnEntityConfig[] = [];

  @state() private _selected: string[] = [];

  @storage({
    storage: "sessionStorage",
    key: "lcn-devices-table-search",
    state: true,
    subscribe: false,
  })
  private _filter: string = "";

  @storage({
    storage: "sessionStorage",
    key: "lcn-devices-table-sort",
    state: false,
    subscribe: false,
  })
  private _activeSorting?: SortingChangedEvent;

  @storage({
    key: "lcn-devices-table-column-order",
    state: false,
    subscribe: false,
  })
  private _activeColumnOrder?: string[];

  @storage({
    key: "lcn-devices-table-hidden-columns",
    state: false,
    subscribe: false,
  })
  private _activeHiddenColumns?: string[];

  private _entities = memoizeOne((entities: LcnEntityConfig[]) => {
    const entityRowData: EntityRowData[] = entities.map((entity) => ({
      ...entity,
      unique_id: createUniqueEntityId(entity),
      delete: entity,
    }));
    return entityRowData;
  });

  private _columns = memoizeOne(
    (): DataTableColumnContainer => ({
      name: {
        main: true,
        title: this.lcn.localize("name"),
        sortable: true,
        filterable: true,
        direction: "asc",
        flex: 2,
      },
      domain: {
        title: this.lcn.localize("domain"),
        sortable: true,
        filterable: true,
      },
      resource: {
        title: this.lcn.localize("resource"),
        sortable: true,
        filterable: true,
      },
      delete: {
        title: this.lcn.localize("delete"),
        sortable: false,
        showNarrow: true,
        minWidth: "80px",
        template: (entity: LcnEntityConfig) => {
          const handler = (ev) => this._onEntityDelete(ev, entity);
          return html`
            <ha-icon-button
              title=${this.lcn.localize("dashboard-entities-table-delete")}
              .path=${mdiDelete}
              @click=${handler}
            ></ha-icon-button>
          `;
        },
      },
    })
  );

  protected async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    loadLCNCreateEntityDialog();

    await this._fetchEntities(this.lcn.config_entry, this.lcn.address);
  }

  protected render(): TemplateResult {
    if (!this._deviceConfig && this.entityConfigs.length === 0) {
      return html` <hass-loading-screen></hass-loading-screen> `;
    }
    return html`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .narrow=${this.narrow}
        .back-path="/config/integrations/integration/lcn"
        .route=${this.route}
        .tabs=${this.tabs}
        .columns=${this._columns()}
        .data=${this._entities(this.entityConfigs)}
        selectable
        .selected=${this._selected.length}
        .initialSorting=${this._activeSorting}
        .columnOrder=${this._activeColumnOrder}
        .hiddenColumns=${this._activeHiddenColumns}
        @columns-changed=${this._handleColumnsChanged}
        @sorting-changed=${this._handleSortingChanged}
        @selection-changed=${this._handleSelectionChanged}
        clickable
        .filter=${this._filter}
        @search-changed=${this._handleSearchChange}
        @row-click=${this._rowClicked}
        id="unique_id"
        .hasfab
        class=${this.narrow ? "narrow" : ""}
      >

        <ha-fab
          slot="fab"
          @click=${this._addEntity}
          .label=${this.lcn.localize("dashboard-entities-add")}
          extended
        >
          <ha-svg-icon slot="icon" path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
    </hass-tabs-subpage-data-table>
    `;
  }

  private getEntityConfigByUniqueId(unique_id: string): LcnEntityConfig | undefined {
    const { address, domain, resource } = parseUniqueEntityId(unique_id);
    const entityConfig = this.entityConfigs.find(
      (el) =>
        el.address[0] === address[0] &&
        el.address[1] === address[1] &&
        el.address[2] === address[2] &&
        el.domain === domain &&
        el.resource === resource,
    );
    return entityConfig;
  }

  private _rowClicked(ev: CustomEvent) {
    this.lcn.log.debug(this.getEntityConfigByUniqueId(ev.detail.id));
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
    this.entityConfigs = await fetchEntities(this.hass!, config_entry, address);
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

  private async _onEntityDelete(ev, entity: LcnEntityConfig) {
    ev.stopPropagation();
    await deleteEntity(this.hass, this.lcn.config_entry, entity);
    this._configurationChanged();
  }

  private _handleSortingChanged(ev: CustomEvent) {
    this._activeSorting = ev.detail;
  }

  private _handleSearchChange(ev: CustomEvent) {
    this._filter = ev.detail.value;
  }

  private _handleColumnsChanged(ev: CustomEvent) {
    this._activeColumnOrder = ev.detail.columnOrder;
    this._activeHiddenColumns = ev.detail.hiddenColumns;
  }

  private _handleSelectionChanged(ev: HASSDomEvent<SelectionChangedEvent>): void {
    this._selected = ev.detail.value;
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyle,
      css`
        hass-tabs-subpage-data-table {
          --data-table-row-height: 60px;
        }
        hass-tabs-subpage-data-table.narrow {
          --data-table-row-height: 72px;
        }
      `,
    ];
  }

}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-entities-page": LCNEntitiesPage;
  }
}
