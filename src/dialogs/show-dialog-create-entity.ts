import { fireEvent } from "@ha/common/dom/fire_event";
import { LCN, LcnEntityConfig, LcnDeviceConfig } from "types/lcn";

export interface LcnEntityDialogParams {
  lcn: LCN;
  deviceConfig: LcnDeviceConfig | undefined;
  createEntity: (entityParams: Partial<LcnEntityConfig>) => Promise<boolean>;
}

export const loadLCNCreateEntityDialog = () => import("./lcn-create-entity-dialog");

export const showLCNCreateEntityDialog = (
  element: HTMLElement,
  lcnEntityDialogParams: LcnEntityDialogParams,
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "lcn-create-entity-dialog",
    dialogImport: loadLCNCreateEntityDialog,
    dialogParams: lcnEntityDialogParams,
  });
};
