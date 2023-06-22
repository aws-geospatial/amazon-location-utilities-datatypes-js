// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";

const extensions = [".js", ".ts"];
const banner = `
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// Third part license at https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/blob/main/LICENSE-THIRD-PARTY.txt
`;

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
      banner,
    },
    {
      file: "dist/es/index.js",
      format: "esm",
      banner,
    },
    {
      file: "dist/index.js",
      format: "iife",
      name: "amazonLocationDataConverter",
      banner,
    },
  ],
};
