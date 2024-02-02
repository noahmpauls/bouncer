import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: "src/scripts/content.ts",
    output: {
      file: "dist/scripts/content.js",
      format: "es"
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: "src/scripts/background.ts",
    output: {
      file: "dist/scripts/background.js",
      format: "es"
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: "src/ui/_assets/scripts/settings.ts",
    output: {
      file: "dist/ui/assets/scripts/settings.js",
      format: "es"
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
    ]
  },
  {
    input: "src/ui/_assets/scripts/createPolicy.ts",
    output: {
      file: "dist/ui/assets/scripts/createPolicy.js",
      format: "es"
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
    ]
  },
]