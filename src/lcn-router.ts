import { customElement, property, state } from "lit/decorators";
import { HassRouterPage, RouterOptions } from "@ha/layouts/hass-router-page";
import type { HomeAssistant, Route } from "@ha/types";
import { LCNLogger } from "lcn-logger";
import { LCN, fetchHosts, LcnHost } from "./types/lcn";

const logger = new LCNLogger("router");

@customElement("lcn-router")
class LCNRouter extends HassRouterPage {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @state() private hosts!: LcnHost[];

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
    initialLoad: () => this._fetchHosts(),
  };

  protected updatePageEl(el): void {
    el.hass = this.hass;
    el.lcn = this.lcn;
    el.route = this.routeTail;
    el.narrow = this.narrow;

    if (this._currentPage === "devices") {
      el.hosts = this.hosts;
    }

    logger.debug(`Current Page: ${this._currentPage} Route: ${this.route.path}`);
  }

  private async _fetchHosts() {
    this.hosts = await fetchHosts(this.hass!);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-router": LCNRouter;
  }
}
