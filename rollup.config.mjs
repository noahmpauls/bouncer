import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

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
    input: "src/pages/settings/settings.ts",
    output: {
      file: "dist/pages/settings/settings.js",
      format: "es"
    },
    plugins: [
      typescript(), nodeResolve(), commonjs(),
      copy({
        targets: [
          {
            src: [ "src/pages/settings/**/*.html", "src/pages/settings/**/*.css" ],
            dest: "dist/pages/settings" 
          }
        ]
      })
    ]
  },
  {
    input: "src/pages/popup/popup.js",
    output: {
      file: "dist/pages/popup/popup.js",
      format: "es"
    },
    plugins: [
      copy({
        targets: [
          {
            src: [ "src/pages/popup/**/*.html", "src/pages/popup/**/*.css" ],
            dest: "dist/pages/popup" 
          }
        ]
      })
    ]
  },
  {
    input: "src/pages/blocked/blocked.js",
    output: {
      file: "dist/pages/blocked/blocked.js",
      format: "es"
    },
    plugins: [
      copy({
        targets: [
          {
            src: [ "src/pages/blocked/**/*.html", "src/pages/blocked/**/*.css" ],
            dest: "dist/pages/blocked" 
          }
        ]
      })
    ]
  }
]