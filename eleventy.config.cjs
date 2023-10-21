const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function(config) {
  config.addPlugin(EleventyHtmlBasePlugin);
  // not necessary, as dev server isn't used
  // config.addWatchTarget("src/ui/_assets/scripts");
  config.addPassthroughCopy({ "src/ui/_assets/styles": "assets/styles" });

  return {
    pathPrefix: "dist/ui",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src/ui",
      output: "dist/ui",
    }
  }
}