import { customElement, property } from "lit/decorators";
import { HassRouterPage, RouterOptions } from "@ha/layouts/hass-router-page";
import type { HomeAssistant, Route } from "@ha/types";
import { LCNLogger } from "lcn-logger";
import { LCN } from "./types/lcn";

const logger = new LCNLogger("router");

@customElement("lcn-router")
class LCNRouter extends HassRouterPage {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  protected routerOptions: RouterOptions = {
    defaultPage: "devices",
    showLoading: true,
    routes: {
      devices: {
        tag: "lcn-config-dashboard",
        load: () => {
          logger.debug("Importing lcn-devices-page");
          return import("./lcn-devices-page");
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
    // initialLoad: () => this._initialLoad(),
  };

  protected updatePageEl(el): void {
    el.hass = this.hass;
    el.lcn = this.lcn;
    el.route = this.routeTail;
    el.narrow = this.narrow;
    logger.debug(`Current Page: ${this._currentPage} Route: ${this.route.path}`);
  }

  // private async _initialLoad() {
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-router": LCNRouter;
  }
}
