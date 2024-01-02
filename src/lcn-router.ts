import { customElement, property } from "lit/decorators";
import {
  HassRouterPage,
  RouterOptions,
} from "@ha/layouts/hass-router-page";
import { HomeAssistant, Route } from "@ha/types";
import { LCN } from "./types/lcn";

@customElement("lcn-router")
class LCNRouter extends HassRouterPage {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public route!: Route;

  @property() public narrow!: boolean;

  protected routerOptions: RouterOptions = {
    defaultPage: "devices",
    showLoading: true,
    // preloadAll: true, // needed to render device page after page reload
    // cacheAll: true, // needed to keep host selection after return from device page
    routes: {
      devices: {
        tag: "lcn-config-dashboard",
        load: () => {
          console.log("Importing lcn-config-dashboard");
          return import("./lcn-config-dashboard");
        },
      },
      entities: {
        tag: "lcn-entities-page",
        load: () => {
          console.log("Importing lcn-entities-page");
          return import("./lcn-entities-page");
        },
      },
    },
  };

  protected updatePageEl(el): void {
    el.hass = this.hass;
    el.lcn = this.lcn;
    el.route = this.routeTail;
    el.narrow = this.narrow;

    console.log(`Current Page: ${this._currentPage} Route: ${this.route.path}`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-router": LCNRouter;
  }
}
