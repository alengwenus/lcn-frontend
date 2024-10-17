import { ContextProvider } from "@lit-labs/context";
import { deviceConfigsContext, entityConfigsContext } from "components/context";
import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";

import { applyThemesOnElement } from "@ha/common/dom/apply_themes_on_element";
import { listenMediaQuery } from "@ha/common/dom/media_query";
import { navigate } from "@ha/common/navigate";
import { makeDialogManager } from "@ha/dialogs/make-dialog-manager";
import "@ha/resources/ha-style";
import { getConfigEntry } from "@ha/data/config_entries";
import type { HomeAssistant, Route } from "@ha/types";
import { fullEntitiesContext } from "@ha/data/context";
import { subscribeEntityRegistry } from "@ha/data/entity_registry";

import "./lcn-router";
import { ProvideHassLitMixin } from "@ha/mixins/provide-hass-lit-mixin";
import { LCNLogger } from "./lcn-logger";
import { localize } from "./localize/localize";
import { LCN, fetchDevices, fetchEntities } from "./types/lcn";
import { LocationChangedEvent } from "./types/navigation";

@customElement("lcn-frontend")
class LcnFrontend extends ProvideHassLitMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @state() private _searchParms = new URLSearchParams(window.location.search);

  private _deviceConfigs = new ContextProvider(this, {
    context: deviceConfigsContext,
    initialValue: [],
  });

  private _entityConfigs = new ContextProvider(this, {
    context: entityConfigsContext,
    initialValue: [],
  });

  private _entitiesContext = new ContextProvider(this, {
    context: fullEntitiesContext,
    initialValue: [],
  });

  protected firstUpdated(_changedProps) {
    super.firstUpdated(_changedProps);
    if (!this.hass) {
      return;
    }
    if (!this.lcn) {
      this._initLCN().then((_value) => this._postLCNSetup());
    }
    this.addEventListener("lcn-location-changed", (e) => this._setRoute(e as LocationChangedEvent));

    listenMediaQuery("(prefers-color-scheme: dark)", (_matches) => {
      this._applyTheme();
    });

    makeDialogManager(this, this.shadowRoot!);

    if (this.route.path === "" || this.route.path === "/") {
      navigate("/lcn/devices", { replace: true });
    }
  }

  protected render() {
    if (!this.hass || !this.lcn) {
      return nothing;
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
    let entry_id: string = this._searchParms.get("config_entry")!;
    if (entry_id != null) {
      window.localStorage.setItem("lcn_entry_id", entry_id);
    }
    entry_id = window.localStorage.getItem("lcn_entry_id")!;
    return getConfigEntry(this.hass, entry_id).then((res) => {
      this.lcn = {
        language: this.hass.language,
        localize: (string, replace) => localize(this.hass, string, replace),
        log: new LCNLogger(),
        config_entry: res.config_entry,
      };
    });
  }

  protected async _postLCNSetup(): Promise<void> {
    this._fetchDevices();
    this._fetchEntities();
    this.addEventListener("lcn-update-device-configs", (_e) => this._fetchDevices());
    this.addEventListener("lcn-update-entity-configs", (_e) => this._fetchEntities());

    subscribeEntityRegistry(this.hass.connection, (entities) => {
      this._entitiesContext.setValue(
        entities.filter((entry) =>
          entry.config_entry_id === this.lcn.config_entry.entry_id
        )
      );
    });
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
    fetchDevices(this.hass, this.lcn.config_entry).then((deviceConfigs) =>
      this._deviceConfigs.setValue(deviceConfigs),
    );
  }

  private async _fetchEntities() {
    fetchEntities(this.hass, this.lcn.config_entry).then((entityConfigs) =>
      this._entityConfigs.setValue(entityConfigs),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-frontend": LcnFrontend;
  }
}
