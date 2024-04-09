const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function(config) {
  config.addPlugin(EleventyHtmlBasePlugin);
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