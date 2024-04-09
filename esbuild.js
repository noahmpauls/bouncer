import * as esbuild from 'esbuild';

const plugin = {
  name: "plugin",
  setup(build) {
    build.onStart(() => {
      console.log("[esbuild] starting building...");
    });
    build.onEnd(result => {
      const errors = result.errors.length;
      if (errors > 0) {
        console.error(`[esbuild] build failed with ${errors} error${errors > 1 ? 's' : ''}.`);
      } else {
        console.log(`[esbuild] build complete.`);
      }
    });
  }
}

const extEntry = (file) => ({
  in: `src/scripts/${file}.ts`,
  out: `scripts/${file}`,
});

const uiEntry = (file) => ({
  in: `src/ui/_assets/scripts/${file}.ts`,
  out: `ui/assets/scripts/${file}`,
});

const extFiles = [
  "content",
  "background"
].map(extEntry);

const uiFiles = [
  "blocked",
  "debug",
  "settings",
  "createPolicy"
].map(uiEntry);

const files = [
  ...extFiles,
  ...uiFiles,
];

const config = {
  entryPoints: files,
  bundle: true,
  format: "esm",
  ignoreAnnotations: true,
  outdir: "dist",
  plugins: [plugin],
  color: true,
};

const args = new Set(process.argv);
const watch = args.has("--watch") || args.has("-w");

if (watch) {
  console.log("watching...");
  let ctx = await esbuild.context(config);
  await ctx.watch();
} else {
  await esbuild.build(config);
}

