module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["test-utils.ts", "**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
  root: true,
};
