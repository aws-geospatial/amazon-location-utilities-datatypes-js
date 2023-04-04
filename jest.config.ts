import { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["test-utils.ts"],
};

export default config;
