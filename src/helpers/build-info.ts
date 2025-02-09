import { VERSION } from "version";

export const isDevBuild = () => VERSION === "dev";

export const isProdBuild = () => VERSION !== "dev";
