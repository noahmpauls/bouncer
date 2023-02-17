import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: "src/bouncer.ts",
    output: {
      file: "dist/bouncer.js",
      format: "es"
    },
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
    ],
  }
]