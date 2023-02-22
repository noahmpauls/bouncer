declare global {
  var chrome: any;
}
globalThis.chrome = { runtime: { id: "jest-test" } };

export {};
