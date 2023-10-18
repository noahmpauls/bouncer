import { pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.json" assert { type: "json" };

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  transform: {
    '.ts': [ 'ts-jest', { useESM: true, tsconfig: './tsconfig.jest.json' }]
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["<rootDir>/test/jest/setup.ts"],

  // https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping/#jest-config-with-helper
  roots: ["<rootDir>"],
  modulePaths: [tsconfig.compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths)
};