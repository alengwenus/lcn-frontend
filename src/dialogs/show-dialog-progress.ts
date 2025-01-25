import type { TemplateResult } from "lit";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { ProgressDialog } from "./progress-dialog";

const getDialog = () =>
  document.querySelector("lcn-frontend")!.shadowRoot!.querySelector("progress-dialog") as
    | ProgressDialog
    | undefined;

export interface ProgressDialogParams {
  text?: string | TemplateResult;
  title?: string;
}

export const loadProgressDialog = () => import("./progress-dialog");

export const showProgressDialog = (
  element: HTMLElement,
  dialogParams: ProgressDialogParams,
): (() => ProgressDialog | undefined) => {
  fireEvent(element, "show-dialog", {
    dialogTag: "progress-dialog",
    dialogImport: loadProgressDialog,
    dialogParams: dialogParams,
  });
  return getDialog;
};
