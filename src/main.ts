import { ContextProvider } from "@lit/context";
import { deviceConfigsContext, entityConfigsContext } from "components/context";
import { html } from "lit";
import "@ha/layouts/hass-loading-screen";
import { customElement, property, state } from "lit/decorators";
import "@ha/resources/append-ha-style";
import { debounce } from "@ha/common/util/debounce";
import { applyThemesOnElement } from "@ha/common/dom/apply_themes_on_element";
import { listenMediaQuery } from "@ha/common/dom/media_query";
import { navigate } from "@ha/common/navigate";
import { makeDialogManager } from "@ha/dialogs/make-dialog-manager";
import { getConfigEntry } from "@ha/data/config_entries";
import type { HomeAssistant, Route } from "@ha/types";
import { fullEntitiesContext } from "@ha/data/context";
import { fetchEntityRegistry } from "@ha/data/entity/entity_registry";
import { contextMixin } from "@ha/state/context-mixin";
import "./lcn-router";
import { HassBaseEl } from "@ha/state/hass-base-mixin";
import type { PropertyValues } from "lit";
import { LCNLogger } from "./lcn-logger";
import { localize } from "./localize/localize";
import type { LCN } from "./types/lcn";
import { fetchDevices, fetchEntities } from "./types/lcn";
import type { LocationChangedEvent } from "./types/navigation";

@customElement("lcn-frontend")
class LcnFrontend extends contextMixin(HassBaseEl) {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @state() private _translationsLoaded = false;

  @state() private _searchParms = new URLSearchParams(window.location.search);

  private _deviceConfigs = new ContextProvider(this, {
    context: deviceConfigsContext,
    initialValue: [],
  });

  private _entityConfigs = new ContextProvider(this, {
    context: entityConfigsContext,
    initialValue: [],
  });

  private _entityRegistryEntries = new ContextProvider(this, {
    context: fullEntitiesContext,
    initialValue: [],
  });

  protected async firstUpdated(_changedProps) {
    super.firstUpdated(_changedProps);
    if (!this.hass) {
      return;
    }
    // connect contexts by contextMixin
    this.hassConnected();

    if (!this.lcn) {
      await this._initLCN();
      await this._postLCNSetup();
    }
    // lcn object must be initialized before loading translations
    if (this.lcn && !this._translationsLoaded) {
      await this._loadTranslations();
    }

    this.addEventListener("lcn-location-changed", (e) => this._setRoute(e as LocationChangedEvent));

    listenMediaQuery("(prefers-color-scheme: dark)", (_matches) => {
      this._applyTheme();
    });

    makeDialogManager(this);

    if (this.route.path === "" || this.route.path === "/") {
      navigate("/lcn/devices", { replace: true });
    }
  }

  protected willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("hass")) {
      // update context providers when hass changes
      this._updateHass(this.hass);
    }
  }

  private async _loadTranslations() {
    const results = await Promise.allSettled([
      // FE translation fragment
      this.hass.loadFragmentTranslation("config"),
      // BE translations
      this.hass.loadBackendTranslation("config_panel", "lcn", false),
      this.hass.loadBackendTranslation("selector", "lcn", false),
    ]);
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        this.lcn.log.error(`Failed to load translation (index ${index}):`, result.reason);
        // try loading the page even if one of the translation loads fails
      }
    });
    this._translationsLoaded = true;
  }

  protected render() {
    if (!this.hass || !this.lcn || !this._translationsLoaded) {
      return html` <hass-loading-screen .message=${"Loading LCN..."}></hass-loading-screen> `;
    }
    return html`
      <lcn-router
        .hass=${this.hass}
        .lcn=${this.lcn}
        .route=${this.route}
        .narrow=${this.narrow}
      ></lcn-router>
    `;
  }

  protected async _initLCN(): Promise<void> {
    let entryId: string = this._searchParms.get("config_entry")!;
    if (entryId != null) {
      window.localStorage.setItem("lcn_entry_id", entryId);
    }
    entryId = window.localStorage.getItem("lcn_entry_id")!;
    this.lcn = {
      language: this.hass.language,
      localize: (string, replace) => localize(this.hass, string, replace),
      log: new LCNLogger(),
      config_entry: (await getConfigEntry(this.hass, entryId)).config_entry,
    };
  }

  protected async _postLCNSetup(): Promise<void> {
    await this._fetchDevices();
    await this._fetchEntities();
    this._fetchEntityRegistryEntries();

    this.addEventListener("lcn-update-device-configs", (_e) => this._fetchDevices());
    this.addEventListener("lcn-update-entity-configs", (_e) => this._fetchEntities());

    this.hass.connection.subscribeEvents(
      debounce(async () => this._fetchEntityRegistryEntries(), 500, false),
      "entity_registry_updated",
    );
  }

  private _setRoute(ev: LocationChangedEvent): void {
    if (!ev.detail?.route) {
      return;
    }
    this.route = ev.detail.route;
    navigate(this.route.path, { replace: true });
    this.requestUpdate();
  }

  private _applyTheme() {
    applyThemesOnElement(
      this.parentElement,
      this.hass.themes,
      this.hass.selectedTheme?.theme ||
        (this.hass.themes.darkMode && this.hass.themes.default_dark_theme
          ? this.hass.themes.default_dark_theme!
          : this.hass.themes.default_theme),
      {
        ...this.hass.selectedTheme,
        dark: this.hass.themes.darkMode,
      },
    );
    this.parentElement!.style.backgroundColor = "var(--primary-background-color)";
    this.parentElement!.style.color = "var(--primary-text-color)";
  }

  private async _fetchDevices() {
    const deviceConfigs = await fetchDevices(this.hass, this.lcn.config_entry);
    this._deviceConfigs.setValue(deviceConfigs);
  }

  private async _fetchEntities() {
    const entityConfigs = await fetchEntities(this.hass, this.lcn.config_entry);
    this._entityConfigs.setValue(entityConfigs);
  }

  private async _fetchEntityRegistryEntries() {
    const entityRegistryEntries = await fetchEntityRegistry(this.hass.connection).then((entries) =>
      entries.filter((entry) => entry.config_entry_id === this.lcn.config_entry.entry_id),
    );
    this._entityRegistryEntries.setValue(entityRegistryEntries);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-frontend": LcnFrontend;
  }
}
