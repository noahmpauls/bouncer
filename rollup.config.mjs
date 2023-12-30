import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: "src/content/bouncerContent.ts",
    output: {
      file: "dist/content/bouncerContent.js",
      format: "es"
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: "src/background/bouncerBackground.ts",
    output: {
      file: "dist/background/bouncerBackground.js",
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