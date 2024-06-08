import { customElement, property, state } from "lit/decorators";
import { HassRouterPage, RouterOptions } from "@ha/layouts/hass-router-page";
import type { HomeAssistant, Route } from "@ha/types";
import { LCNLogger } from "lcn-logger";
import { getConfigEntry } from "@ha/data/config_entries";
import { LCN } from "./types/lcn";

const logger = new LCNLogger("router");

@customElement("lcn-router")
class LCNRouter extends HassRouterPage {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @state() private _searchParms = new URLSearchParams(window.location.search);

  protected routerOptions: RouterOptions = {
    defaultPage: "devices",
    showLoading: true,
    routes: {
      devices: {
        tag: "lcn-config-dashboard",
        load: () => {
          logger.debug("Importing lcn-config-dashboard");
          return import("./lcn-config-dashboard");
        },
      },
      entities: {
        tag: "lcn-entities-page",
        load: () => {
          logger.debug("Importing lcn-entities-page");
          return import("./lcn-entities-page");
        },
      },
    },
    initialLoad: () => this._fetchConfigEntry(this._searchParms.get("config_entry")!),
  };

  protected updatePageEl(el): void {
    el.hass = this.hass;
    el.lcn = this.lcn;
    el.route = this.routeTail;
    el.narrow = this.narrow;
    logger.debug(`Current Page: ${this._currentPage} Route: ${this.route.path}`);
  }

  private async _fetchConfigEntry(entry_id: string) {
    const res = await getConfigEntry(this.hass!, entry_id);
    this.lcn.config_entry = res.config_entry;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-router": LCNRouter;
  }
}
