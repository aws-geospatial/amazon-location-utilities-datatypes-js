// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { nodeResolve } from "@rollup/plugin-node-resolve";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";

const banner = `
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// Third party license at https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/blob/main/LICENSE-THIRD-PARTY.txt
`;

export default {
  input: "./dist/esm/index.js",
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs(),
  ],

  output: [
    {
      file: "dist/amazonLocationDataConverter.js",
      format: "esm",
      banner,
      plugins: [
        getBabelOutputPlugin({
          minified: true,
          moduleId: "amazonLocationDataConverter",
          presets: [["@babel/env", { modules: "umd" }]],
        }),
      ],
    },
  ],
};
