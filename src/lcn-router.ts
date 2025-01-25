import { mdiDevices, mdiShape } from "@mdi/js";
import { customElement, property } from "lit/decorators";
import type { RouterOptions } from "@ha/layouts/hass-router-page";
import { HassRouterPage } from "@ha/layouts/hass-router-page";
import type { HomeAssistant, Route } from "@ha/types";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import { LCNLogger } from "lcn-logger";
import type { LCN } from "./types/lcn";

const logger = new LCNLogger("router");

export const lcnMainTabs: PageNavigation[] = [
  {
    path: "/lcn/devices",
    translationKey: "modulesgroups",
    iconPath: mdiDevices,
  },
  {
    path: "/lcn/entities",
    translationKey: "entities",
    iconPath: mdiShape,
  },
];

@customElement("lcn-router")
class LCNRouter extends HassRouterPage {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  protected routerOptions: RouterOptions = {
    defaultPage: "devices",
    routes: {
      devices: {
        tag: "lcn-devices-page",
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
  };

  protected updatePageEl(el): void {
    el.hass = this.hass;
    el.lcn = this.lcn;
    el.route = this.routeTail;
    el.narrow = this.narrow;
    logger.debug(`Current Page: ${this._currentPage} Route: ${this.route.path}`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-router": LCNRouter;
  }
}
