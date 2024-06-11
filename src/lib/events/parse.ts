import { FrameContext, PageOwner } from "./types";

export const parseFrameContext = (s: string) => {
  switch (s) {
    case FrameContext.ROOT: return FrameContext.ROOT;
    case FrameContext.EMBED: return FrameContext.EMBED;
    default:
      throw new Error(`invalid FrameContext type ${s} cannot be parsed`);
  }
}

export const parsePageOwner = (s: string) => {
  switch (s) {
    case PageOwner.SELF: return PageOwner.SELF;
    case PageOwner.WEB: return PageOwner.WEB;
    default:
      throw new Error(`invalid PageOwner type ${s} cannot be parsed`);
  }
}