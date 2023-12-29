import { customElement, property } from "lit/decorators";
import { parseAddressString } from "types/lcn";
import {
  HassRouterPage,
  RouterOptions,
} from "@ha/layouts/hass-router-page";
import { HomeAssistant } from "@ha/types";

@customElement("lcn-config-dashboard-router")
class LCNConfigDashboardRouter extends HassRouterPage {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  private _configEntry = new URLSearchParams(window.location.search).get(
    "config_entry"
  );

  protected routerOptions: RouterOptions = {
    defaultPage: "devices",
    showLoading: true,
    // preloadAll: true, // needed to render device page after page reload
    // cacheAll: true, // needed to keep host selection after return from device page
    routes: {
      devices: {
        tag: "lcn-config-dashboard",
        load: () => import("./lcn-config-dashboard"),
      },
      entities: {
        tag: "lcn-entities-page",
        load: () => import("./lcn-entities-page"),
      },
    },
  };

  protected updatePageEl(el): void {
    el.route = this.routeTail;
    el.hass = this.hass;
    el.isWide = this.isWide;
    el.narrow = this.narrow;
    if (this._currentPage === "entities") {
      el.hostId = this.routeTail.path.substr(1).split("/")[0];
      const addressString = this.routeTail.path.substr(1).split("/")[1];
      const address = parseAddressString(addressString);
      el.address = address;
    } else if (this._currentPage === "devices") {
      const searchParams = new URLSearchParams(window.location.search);
      if (this._configEntry && !searchParams.has("config_entry")) {
        // searchParams.append("config_entry", this._configEntry);
        el.hostId = this._configEntry;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-dashboard-router": LCNConfigDashboardRouter;
  }
}
