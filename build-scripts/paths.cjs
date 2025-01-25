/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

module.exports = {
  polymer_dir: path.resolve(__dirname, ".."),

  src_dir: path.resolve(__dirname, "../src"),

  build_dir: path.resolve(__dirname, "../lcn_frontend"),
  upstream_build_dir: path.resolve(__dirname, "../homeassistant-frontend/build"),
  app_output_root: path.resolve(__dirname, "../lcn_frontend"),
  app_output_static: path.resolve(__dirname, "../lcn_frontend/static"),
  app_output_latest: path.resolve(__dirname, "../lcn_frontend/frontend_latest"),
  app_output_es5: path.resolve(__dirname, "../lcn_frontend/frontend_es5"),

  lcn_dir: path.resolve(__dirname, ".."),
  lcn_output_root: path.resolve(__dirname, "../lcn_frontend"),
  lcn_output_static: path.resolve(__dirname, "../lcn_frontend/static"),
  lcn_output_latest: path.resolve(__dirname, "../lcn_frontend/frontend_latest"),
  lcn_output_es5: path.resolve(__dirname, "../lcn_frontend/frontend_es5"),
  lcn_publicPath: "/lcn_static",

  translations_src: path.resolve(__dirname, "../homeassistant-frontend/src/translations"),
};
