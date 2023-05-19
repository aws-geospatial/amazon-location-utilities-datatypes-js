// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";

const extensions = [".js", ".ts"];

export default {
  input: "./src/index.ts",
  plugins: [
    resolve({ extensions }),
    babel({
      extensions,
      babelHelpers: "bundled",
      include: ["src/**/*"],
    }),
  ],

  output: [
    {
      file: "dist/js/index.js",
      format: "cjs",
    },
    {
      file: "dist/es/index.js",
      format: "esm",
    },
    {
      file: "dist/index.js",
      format: "iife",
      name: "amazonLocationDataConverter",
    },
  ],
};
