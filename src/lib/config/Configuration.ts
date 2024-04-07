import type { IConfiguration } from "./types";

export const Configuration = {
  default: (): IConfiguration => ({
    maxLogs: 5_000,
  }),
}
