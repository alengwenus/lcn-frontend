import { fireEvent } from "@ha/common/dom/fire_event";
import { LcnDeviceConfig } from "types/lcn";

export interface LcnDeviceDialogParams {
  createDevice: (values: Partial<LcnDeviceConfig>) => Promise<unknown>;
}

export const loadLCNCreateDeviceDialog = () =>
  import(
    /* webpackChunkName: "lcn-create-device-dialog" */ "./lcn-create-device-dialog"
  );

export const showLCNCreateDeviceDialog = (
  element: HTMLElement,
  lcnDeviceParams: LcnDeviceDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "lcn-create-device-dialog",
    dialogImport: loadLCNCreateDeviceDialog,
    dialogParams: lcnDeviceParams,
  });
};
