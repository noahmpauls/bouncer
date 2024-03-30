import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const files = [
  {
    input: "src/scripts/content.ts",
    output: "dist/scripts/content.js",
  },
  {
    input: "src/scripts/background.ts",
    output: "dist/scripts/background.js",
  },
  {
    input: "src/ui/_assets/scripts/blocked.ts",
    output: "dist/ui/assets/scripts/blocked.js",
  },
  {
    input: "src/ui/_assets/scripts/settings.ts",
    output: "dist/ui/assets/scripts/settings.js",
  },
  {
    input: "src/ui/_assets/scripts/createPolicy.ts",
    output: "dist/ui/assets/scripts/createPolicy.js",
  },
]

const config = files.map(f => ({
  input: f.input,
  output: {
    file: f.output,
    format: "es",
  },
  plugins: [
    typescript(),
    nodeResolve(),
  ],
}));

export default config;