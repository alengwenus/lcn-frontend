/* eslint @typescript-eslint/no-var-requires: "off", import/extensions: "off" */
import gulp from "gulp";
import env from "../env.cjs";

import "./clean.js";
import "./webpack.js";
import "./compress.js";
import "./entry-html.js";
import "./gen-icons-json.js";

gulp.task(
  "develop-lcn",
  gulp.series(
    async () => {
      process.env.NODE_ENV = "development";
    },
    "clean-lcn",
    "gen-icons-json",
    "gen-index-lcn-dev",
    "webpack-watch-lcn"
  )
);

gulp.task(
  "build-lcn",
  gulp.series(
    async () => {
      process.env.NODE_ENV = "production";
    },
    "clean-lcn",
    "ensure-lcn-build-dir",
    "gen-icons-json",
    "webpack-prod-lcn",
    "gen-index-lcn-prod",
    ...// Don't compress running tests
    (env.isTest() ? [] : ["compress-lcn"])
  )
);
