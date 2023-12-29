import { deleteSync } from "del";
import gulp from "gulp";
import paths from "../paths.cjs";

gulp.task("clean-lcn", async () =>
    deleteSync([paths.lcn_output_root, paths.build_dir])
);
