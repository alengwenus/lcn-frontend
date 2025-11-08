import { consume } from "@lit/context";
import { deviceConfigsContext, entityConfigsContext } from "components/context";
import { fullEntitiesContext } from "@ha/data/context";
import { haStyle } from "@ha/resources/styles";
import type { EntityRegistryEntry } from "@ha/data/entity_registry";
import type { CSSResultGroup, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined";
import { customElement, property, state, queryAsync } from "lit/decorators";
import { mdiPlus, mdiDelete } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import { computeDomain } from "@ha/common/entity/compute_domain";
import "@ha/layouts/hass-tabs-subpage-data-table";
import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import memoize from "memoize-one";
import { storage } from "@ha/common/decorators/storage";
import "@ha/panels/config/ha-config-section";
import "@ha/components/ha-button";
import "@ha/components/ha-svg-icon";
import "@ha/components/ha-icon";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-state-icon";
import "@ha/components/ha-domain-icon";
import "@ha/components/ha-fab";
import "@ha/components/ha-tooltip";
import { mainWindow } from "@ha/common/dom/get_main_window";
import type {
  LCN,
  LcnDeviceConfig,
  LcnEntityConfig,
  LcnAddress,
  LcnDomainData,
  SwitchConfig,
  LightConfig,
  BinarySensorConfig,
  SensorConfig,
  ClimateConfig,
  SceneConfig,
  CoverConfig,
} from "types/lcn";
import { addEntity, deleteEntity } from "types/lcn";
import { updateEntityConfigs } from "components/events";
import type { HASSDomEvent } from "@ha/common/dom/fire_event";
import type {
  DataTableColumnContainer,
  RowClickedEvent,
  SelectionChangedEvent,
  SortingChangedEvent,
} from "@ha/components/data-table/ha-data-table";
import { fireEvent } from "@ha/common/dom/fire_event";
import { addressToString, stringToAddress } from "helpers/address_conversion";
import { lcnMainTabs } from "lcn-router";
import type { DataTableFiltersItems, DataTableFiltersValues } from "@ha/data/data_table_filters";
import { renderBrandLogo } from "helpers/brand_logo";
import {
  loadLCNCreateEntityDialog,
  showLCNCreateEntityDialog,
} from "./dialogs/show-dialog-create-entity";
import "components/lcn-filter-address";

export interface EntityRowData extends LcnEntityConfig {
  unique_id: string;
  address_str: string;
  entityRegistryEntry: EntityRegistryEntry;
}

function getResource(domainName: string, domainData: LcnDomainData): string {
  let resource = "";
  switch (domainName) {
    case "switch":
      resource = (domainData as SwitchConfig).output;
      break;
    case "light":
      resource = (domainData as LightConfig).output;
      break;
    case "sensor":
      resource = (domainData as SensorConfig).source;
      break;
    case "binary_sensor":
      resource = (domainData as BinarySensorConfig).source;
      break;
    case "cover":
      resource = (domainData as CoverConfig).motor;
      break;
    case "climate":
      resource = `${(domainData as ClimateConfig).setpoint}`;
      break;
    case "scene":
      resource = `${(domainData as SceneConfig).register}${(domainData as SceneConfig).scene}`;
      break;
  }
  return resource.toLowerCase();
}

function createUniqueEntityId(entity: LcnEntityConfig, includeDomain = true): string {
  let uniqueId = `${addressToString(entity.address)}-${getResource(entity.domain, entity.domain_data)}`;
  if (includeDomain) {
    uniqueId = `${entity.domain}-` + uniqueId;
  }
  return uniqueId;
}

function parseUniqueEntityId(uniqueId: string): {
  address: LcnAddress;
  domain: string;
  resource: string;
} {
  const splitted = uniqueId.split("-");
  const resource = splitted.pop()!;
  const address = splitted.pop();
  const domain = splitted.pop()!;
  const lcnAddress = stringToAddress(address!);
  const result = { address: lcnAddress, domain: domain, resource: resource };
  return result;
}

@customElement("lcn-entities-page")
export class LCNEntitiesPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @state() private _deviceConfig: LcnDeviceConfig | undefined;

  @state()
  @consume({ context: deviceConfigsContext, subscribe: true })
  _deviceConfigs!: LcnDeviceConfig[];

  @state()
  @consume({ context: entityConfigsContext, subscribe: true })
  _entityConfigs!: LcnEntityConfig[];

  @state()
  @consume({ context: fullEntitiesContext, subscribe: true })
  _entityRegistryEntries!: EntityRegistryEntry[];

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
  private _filter: string = history.state?.filter || "";

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

  @queryAsync("hass-tabs-subpage-data-table")
  private _dataTable!: Promise<HaTabsSubpageDataTable>;

  private get _extEntityConfigs(): EntityRowData[] {
    const extEntityConfigs = memoize(
      (
        entityConfigs: LcnEntityConfig[] = this._entityConfigs,
        entityRegistryEntries: EntityRegistryEntry[] = this._entityRegistryEntries,
      ) =>
        entityConfigs.map((entityConfig) => ({
          ...entityConfig,
          unique_id: createUniqueEntityId(entityConfig),
          address_str: addressToString(entityConfig.address),
          entityRegistryEntry: entityRegistryEntries.find(
            (entry) =>
              computeDomain(entry.entity_id) === entityConfig.domain &&
              createUniqueEntityId(entityConfig, false) ===
                entry.unique_id.split("-").slice(1).join("-"),
          )!,
        })),
    );
    return extEntityConfigs();
  }

  private _columns = memoize(
    (): DataTableColumnContainer<EntityRowData> => ({
      icon: {
        title: "",
        label: "Icon",
        type: "icon",
        showNarrow: true,
        moveable: false,
        template: (entry) =>
          entry.entityRegistryEntry
            ? entry.entityRegistryEntry.icon
              ? html`<ha-icon .icon=${entry.entityRegistryEntry.icon}></ha-icon>`
              : this.hass.states[entry.entityRegistryEntry.entity_id]
                ? html`
                    <ha-state-icon
                      title=${ifDefined(
                        this.hass.states[entry.entityRegistryEntry.entity_id].state,
                      )}
                      slot="item-icon"
                      .hass=${this.hass}
                      .stateObj=${this.hass.states[entry.entityRegistryEntry.entity_id]}
                    ></ha-state-icon>
                  `
                : html`<ha-domain-icon
                    .domain=${computeDomain(entry.entityRegistryEntry.entity_id)}
                  ></ha-domain-icon>`
            : nothing,
      },
      name: {
        main: true,
        title: this.lcn.localize("name"),
        sortable: true,
        filterable: true,
        direction: "asc",
        flex: 2,
        template: (entry) =>
          entry.entityRegistryEntry
            ? entry.entityRegistryEntry.name || entry.entityRegistryEntry.original_name!
            : entry.name,
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
        template: (entry) => getResource(entry.domain, entry.domain_data),
      },
      delete: {
        title: this.lcn.localize("delete"),
        showNarrow: true,
        moveable: false,
        type: "icon-button",
        template: (entry) => {
          const handler = (_ev) => this._deleteEntities([entry]);
          return html`
            <ha-tooltip
              content=${this.lcn.localize("dashboard-entities-table-delete")}
              distance="-5"
              placement="left"
            >
              <ha-icon-button
                id=${"delete-entity-" + entry.unique_id}
                .label=${this.lcn.localize("dashboard-entities-table-delete")}
                .path=${mdiDelete}
                @click=${handler}
              ></ha-icon-button>
            </ha-tooltip>
          `;
        },
      },
    }),
  );

  private _filteredEntities = memoize(
    (
      filters: DataTableFiltersValues,
      filteredItems: DataTableFiltersItems,
      entities: EntityRowData[],
    ) => {
      let filteredEntityConfigs = entities;

      Object.entries(filters).forEach(([key, filter]) => {
        if (key === "lcn-filter-address" && Array.isArray(filter) && filter.length) {
          filteredEntityConfigs = filteredEntityConfigs.filter((entityConfig) =>
            filter.includes(entityConfig.address_str),
          );
        }
      });

      Object.values(filteredItems).forEach((items) => {
        if (items) {
          filteredEntityConfigs = filteredEntityConfigs.filter((entityConfig) =>
            items.has(entityConfig.unique_id),
          );
        }
      });

      return filteredEntityConfigs;
    },
  );

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

    this._updateFilteredDevice();
  }

  private _updateFilteredDevice() {
    let address: LcnAddress;
    if (
      "lcn-filter-address" in this._filters &&
      this._filters["lcn-filter-address"] &&
      this._filters["lcn-filter-address"][0]
    ) {
      address = stringToAddress(this._filters["lcn-filter-address"][0]);
    } else {
      const filteredEntities = this._filteredEntities(
        this._filters,
        this._filteredItems,
        this._extEntityConfigs,
      );
      if (filteredEntities.length === 0) {
        this._deviceConfig = undefined;
        return;
      }
      address = filteredEntities[0].address;
    }
    this._deviceConfig = this._deviceConfigs.find(
      (deviceConfig) =>
        deviceConfig.address[0] === address[0] &&
        deviceConfig.address[1] === address[1] &&
        deviceConfig.address[2] === address[2],
    );
  }

  protected async firstUpdated(changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(changedProperties);
    loadLCNCreateEntityDialog();
    updateEntityConfigs(this);
    this._setFiltersFromUrl();
  }

  protected async updated(changedProperties: PropertyValues): Promise<void> {
    super.updated(changedProperties);
    this._dataTable.then(renderBrandLogo);
  }

  private _setFiltersFromUrl() {
    const address = this._searchParms.get("address");

    if (!address && this._filters) {
      this._filters = {};
      return;
    }

    this._filter = history.state?.filter || "";

    this._filters = {
      "lcn-filter-address": address ? [address] : [],
    };

    this._updateFilteredDevice();
  }

  protected render() {
    if (!(this.hass && this.lcn && this._deviceConfigs && this._entityConfigs)) {
      return nothing;
    }
    const filteredEntities = this._filteredEntities(
      this._filters,
      this._filteredItems,
      this._extEntityConfigs,
    );

    const hasFab = this._deviceConfigs.length > 0;
    return html`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/lcn/devices"
        noDataText=${this._deviceConfigs.length === 0
          ? this.lcn.localize("dashboard-entities-no-data-text-devices")
          : this.lcn.localize("dashboard-entities-no-data-text-entities")}
        .route=${this.route}
        .tabs=${lcnMainTabs}
        .localizeFunc=${this.lcn.localize}
        .columns=${this._columns()}
        .data=${filteredEntities}
        hasFilters
        .filters=${Object.values(this._filters).filter((filter) =>
          Array.isArray(filter)
            ? filter.length
            : filter &&
              Object.values(filter).some((val) => (Array.isArray(val) ? val.length : val)),
        ).length}
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
        @row-click=${this._openEditEntry}
        id="unique_id"
        .hasfab=${hasFab}
        class=${this.narrow ? "narrow" : ""}
      >
        <div class="header-btns" slot="selection-bar">
          ${!this.narrow
            ? html`
                <ha-button @click=${this._deleteSelected} class="warning">
                  ${this.lcn.localize("delete-selected")}
                </ha-button>
              `
            : html`
                <ha-icon-button
                  class="warning"
                  id="remove-btn"
                  @click=${this._deleteSelected}
                  .path=${mdiDelete}
                  .label=${this.lcn.localize("delete-selected")}
                ></ha-icon-button>
                <ha-help-tooltip .label=${this.lcn.localize("delete-selected")} )}>
                </ha-help-tooltip>
              `}
        </div>

        <lcn-filter-address
          .hass=${this.hass}
          .lcn=${this.lcn}
          .value=${this._filters["lcn-filter-address"]}
          .deviceConfigs=${this._deviceConfigs}
          @data-table-filter-changed=${this._filterChanged}
          slot="filter-pane"
          .expanded=${this._expandedFilter === "lcn-filter-address"}
          .narrow=${this.narrow}
          @expanded-changed=${this._filterExpanded}
        ></lcn-filter-address>

        ${hasFab
          ? html`
              <ha-fab
                slot="fab"
                @click=${this._addEntity}
                .label=${this.lcn.localize("dashboard-entities-add")}
                extended
              >
                <ha-svg-icon slot="icon" path=${mdiPlus}></ha-svg-icon>
              </ha-fab>
            `
          : nothing}
      </hass-tabs-subpage-data-table>
    `;
  }

  private _getEntityConfigByUniqueId(uniqueId: string): LcnEntityConfig {
    const { address, domain, resource } = parseUniqueEntityId(uniqueId);
    const entityConfig = this._entityConfigs.find(
      (el) =>
        el.address[0] === address[0] &&
        el.address[1] === address[1] &&
        el.address[2] === address[2] &&
        el.domain === domain &&
        getResource(el.domain, el.domain_data) === resource,
    );
    return entityConfig!;
  }

  private async _openEditEntry(ev: CustomEvent): Promise<void> {
    const uniqueId = (ev.detail as RowClickedEvent).id;
    const entityConfig = this._getEntityConfigByUniqueId(uniqueId);
    const entityRegistryEntry = this._entityRegistryEntries.find(
      (entry) =>
        computeDomain(entry.entity_id) === entityConfig.domain &&
        createUniqueEntityId(entityConfig, false) === entry.unique_id.split("-").slice(1).join("-"),
    )!;

    fireEvent(mainWindow.document.querySelector("home-assistant")!, "hass-more-info", {
      entityId: entityRegistryEntry.entity_id,
    });
  }

  private async _addEntity() {
    showLCNCreateEntityDialog(this, {
      lcn: this.lcn,
      deviceConfig: this._deviceConfig as LcnDeviceConfig | undefined,
      createEntity: async (entityParams) => {
        if (await addEntity(this.hass, this.lcn.config_entry, entityParams)) {
          updateEntityConfigs(this);
          return true;
        }
        return false;
      },
    });
  }

  private async _deleteSelected() {
    const entities = this._selected.map((uniqueId) => this._getEntityConfigByUniqueId(uniqueId));
    this._deleteEntities(entities);
    this._clearSelection();
  }

  private async _deleteEntities(entities: LcnEntityConfig[]) {
    if (entities.length === 0) return;
    for await (const entity of entities) {
      await deleteEntity(this.hass, this.lcn.config_entry, entity);
    }
    updateEntityConfigs(this);
  }

  private async _clearSelection() {
    (await this._dataTable).clearSelection();
  }

  private _clearFilter() {
    this._filters = {};
    this._filteredItems = {};
    this._updateFilteredDevice();
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
