import { haStyle } from "@ha/resources/styles";
import { css, html, LitElement, CSSResultGroup, nothing } from "lit";
import { customElement, property, state, query } from "lit/decorators";
import { mdiPlus, mdiDelete } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import "@ha/layouts/hass-tabs-subpage-data-table";
import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import "@ha/layouts/hass-tabs-subpage";
import memoize from "memoize-one";
import { storage } from "@ha/common/decorators/storage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-fab";
import { mainWindow } from "@ha/common/dom/get_main_window";
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
import { lcnMainTabs } from "lcn-router";
import {
  DataTableFiltersItems,
  DataTableFiltersValues,
} from "@ha/data/data_table_filters";
import {
  loadLCNCreateEntityDialog,
  showLCNCreateEntityDialog,
} from "./dialogs/show-dialog-create-entity";
import "components/lcn-filter-address";


export interface EntityRowData extends LcnEntityConfig {
  unique_id: string;
  address_str: string;
};

function createUniqueEntityId(entity: LcnEntityConfig, includeDomain: boolean = true): string {
  let unique_id = `${addressToString(entity.address)}-${entity.resource}`
  if (includeDomain) {
    unique_id = `${entity.domain}-` + unique_id
  }
  return unique_id
}

function parseUniqueEntityId(unique_id: string):
    { address: LcnAddress; domain: string; resource: string } {
  const splitted = unique_id.split("-");
  const resource = splitted.pop()!;
  const address_str = splitted.pop();
  const domain = splitted.pop()!;
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

  @state() private _deviceConfig!: LcnDeviceConfig;

  @state() private entityConfigs: LcnEntityConfig[] = [];

  @storage({
    storage: "sessionStorage",
    key: "entities-table-filters",
    state: true,
    subscribe: false,
  })
  private _filters: DataTableFiltersValues = {};

  @state() private _filteredItems: DataTableFiltersItems = {};

  @state() private _selected: string[] = [];

  @state() private _expandedFilter?: string;

  @storage({
    storage: "sessionStorage",
    key: "lcn-entities-table-search",
    state: true,
    subscribe: false,
  })
  private _filter: string = history.state?.filter || "";;

  @state() private _searchParms = new URLSearchParams(mainWindow.location.search);

  @storage({
    storage: "sessionStorage",
    key: "lcn-entities-table-sort",
    state: false,
    subscribe: false,
  })
  private _activeSorting?: SortingChangedEvent;

  @storage({
    key: "lcn-entities-table-column-order",
    state: false,
    subscribe: false,
  })
  private _activeColumnOrder?: string[];

  @storage({
    key: "lcn-entities-table-hidden-columns",
    state: false,
    subscribe: false,
  })
  private _activeHiddenColumns?: string[];

  @query("hass-tabs-subpage-data-table", true)
  private _dataTable!: HaTabsSubpageDataTable;

  private _entities = (entities: LcnEntityConfig[]) => {
    const entityRowData: EntityRowData[] = entities.map((entity) => ({
      ...entity,
      unique_id: createUniqueEntityId(entity),
      address_str: addressToString(entity.address),
    }));
    return entityRowData;
  };

  private _columns = memoize(
    (): DataTableColumnContainer => ({
      name: {
        main: true,
        title: this.lcn.localize("name"),
        sortable: true,
        filterable: true,
        direction: "asc",
        flex: 2,
      },
      address_str: {
        title: this.lcn.localize("address"),
        sortable: true,
        filterable: true,
        direction: "asc",
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
    })
  );

  private _filteredEntities = memoize(
    (
      filters: DataTableFiltersValues,
      filteredItems: DataTableFiltersItems
    ) => {
      let filteredEntityConfigs = this._entities(this.entityConfigs);

      Object.entries(filters).forEach(([key, filter]) => {
        if (key === "lcn-filter-address" && Array.isArray(filter) && filter.length) {
          filteredEntityConfigs = filteredEntityConfigs.filter((entityConfig) =>
            filter.includes(entityConfig.address_str)
          )
        }
      });

      Object.values(filteredItems).forEach((items) => {
        if (items) {
          filteredEntityConfigs = filteredEntityConfigs.filter((entityConfig) =>
            items.has(entityConfig.unique_id)
          );
        }
      });

      return filteredEntityConfigs;
      }
  )

  private _filterExpanded(ev) {
    if (ev.detail.expanded) {
      this._expandedFilter = ev.target.localName;
    } else if (this._expandedFilter === ev.target.localName) {
      this._expandedFilter = undefined;
    }
  }

  private _filterChanged(ev) {
    const type = ev.target.localName;

    this._filters = { ...this._filters, [type]: ev.detail.value };
    this._filteredItems = { ...this._filteredItems, [type]: ev.detail.items };
  }

  protected async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    loadLCNCreateEntityDialog();
    await this._fetchEntities(this.lcn.config_entry);
    this._setFiltersFromUrl();
  }

  private _setFiltersFromUrl() {
    const address_str = this._searchParms.get("address");

    if (!address_str) {
      this._filters = {}
      return
    }

    this._filter = history.state?.filter || "";

    this._filters = {
      "lcn-filter-address": address_str ? [address_str] : [],
    }
  }

  protected render() {
    if (!this._deviceConfig && this.entityConfigs.length === 0) {
      return nothing
    }

    const filteredEntities = this._filteredEntities(this._filters, this._filteredItems)

    return html`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .narrow=${this.narrow}
        .back-path="/config/integrations/integration/lcn"
        .route=${this.route}
        .tabs=${lcnMainTabs}
        .localizeFunc=${this.lcn.localize}
        .columns=${this._columns()}
        .data=${filteredEntities}
        hasFilters
        .filters=${
          Object.values(this._filters).filter((filter) =>
            Array.isArray(filter)
              ? filter.length
              : filter &&
                Object.values(filter).some((val) =>
                  Array.isArray(val) ? val.length : val
                )
          ).length
        }
        selectable
        .selected=${this._selected.length}
        .initialSorting=${this._activeSorting}
        .columnOrder=${this._activeColumnOrder}
        .hiddenColumns=${this._activeHiddenColumns}
        @columns-changed=${this._handleColumnsChanged}
        @sorting-changed=${this._handleSortingChanged}
        @selection-changed=${this._handleSelectionChanged}
        clickable
        @clear-filter=${this._clearFilter}
        .filter=${this._filter}
        @search-changed=${this._handleSearchChange}
        @row-click=${this._rowClicked}
        id="unique_id"
        .hasfab
        class=${this.narrow ? "narrow" : ""}
      >

        <div class="header-btns" slot="selection-bar">
          ${!this.narrow
            ? html`
                <mwc-button @click=${this._deleteSelected} class="warning">
                  ${this.lcn.localize("delete-selected")}
                </mwc-button>
              `
            : html`
                <ha-icon-button
                  class="warning"
                  id="remove-btn"
                  @click=${this._deleteSelected}
                  .path=${mdiDelete}
                  .label=${this.lcn.localize("delete-selected")}
                ></ha-icon-button>
                <ha-help-tooltip
                  .label=${this.lcn.localize("delete-selected")}
                  )}
                >
                </ha-help-tooltip>
            `
          }
        </div>

        <lcn-filter-address
          .hass=${this.hass}
          .lcn=${this.lcn}
          .value=${this._filters["lcn-filter-address"]}
          .entityConfigs=${this._entities(this.entityConfigs)}
          @data-table-filter-changed=${this._filterChanged}
          slot="filter-pane"
          .expanded=${this._expandedFilter === "lcn-filter-address"}
          .narrow=${this.narrow}
          @expanded-changed=${this._filterExpanded}
        ></lcn-filter-address>

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

  private getEntityConfigByUniqueId(unique_id: string): LcnEntityConfig {
    const { address, domain, resource } = parseUniqueEntityId(unique_id);
    const entityConfig = this.entityConfigs.find(
      (el) =>
        el.address[0] === address[0] &&
        el.address[1] === address[1] &&
        el.address[2] === address[2] &&
        el.domain === domain &&
        el.resource === resource,
    );
    return entityConfig!;
  }

  private _rowClicked(ev: CustomEvent) {
    this.lcn.log.debug(this.getEntityConfigByUniqueId(ev.detail.id));
  }

  private async _fetchEntities(config_entry: ConfigEntry, address: LcnAddress | undefined = undefined) {
    if (address !== undefined) {
      const deviceConfigs = await fetchDevices(this.hass!, config_entry);
      const deviceConfig = deviceConfigs.find(
        (el) =>
          el.address[0] === address![0] &&
          el.address[1] === address![1] &&
          el.address[2] === address![2],
      );
      if (deviceConfig !== undefined) {
        this._deviceConfig = deviceConfig;
      }
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

  private async _deleteSelected() {
    const entities = this._selected.map((unique_id) =>
      this.getEntityConfigByUniqueId(unique_id)
    );

    for await (const entity of entities) {
      await deleteEntity(this.hass, this.lcn.config_entry, entity);
    };
    this._clearSelection();
    this._fetchEntities(this.lcn.config_entry, this.lcn.address);
  }

  private _clearSelection() {
    this._dataTable.clearSelection();
  }

  private _clearFilter() {
    this._filters = {};
    this._filteredItems = {};
  }

  private _handleSortingChanged(ev: CustomEvent) {
    this._activeSorting = ev.detail;
  }

  private _handleSearchChange(ev: CustomEvent) {
    this._filter = ev.detail.value;
    history.replaceState({ filter: this._filter }, "");
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
