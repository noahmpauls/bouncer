import { ScheduledLimit } from "@bouncer/enforcer";
import { FrameContext, PageOwner } from "@bouncer/events";
import { BasicGuard } from "@bouncer/guard";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { AndMatcher, DomainMatcher, FrameContextMatcher, NotMatcher, PathPrefixMatcher, OrMatcher, PageOwnerMatcher, QueryParamsMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { PeriodicInterval, PeriodicTime } from "@bouncer/period";
import { BasicPolicy } from "@bouncer/policy";
import { AlwaysSchedule, PeriodicSchedule } from "@bouncer/schedule";

export const sampleGuards = [
  new BasicPolicy(
    "Block Google searches for \"news\"",
    true,
    new AndMatcher([
      new DomainMatcher("www.google.com", { include: [] }),
      new QueryParamsMatcher({ q: [ "news" ] }),
    ]),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new AlwaysBlock(),
    ),
  ),
  new BasicPolicy(
    "Block all of reddit except for MIT and Fujifilm subreddits",
    true,
    new AndMatcher([
      new DomainMatcher("reddit.com", { exclude: [] }),
      new NotMatcher(new OrMatcher([
        new PathPrefixMatcher("/r/fujifilm", true),
        new PathPrefixMatcher("/r/mit", true),
      ])),
    ]),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new AlwaysBlock(),
    ),
  ),
  new BasicPolicy(
    "Domain matcher block",
    true,
    new DomainMatcher(
      "google.com",
      { include: [ "workspace", "adsense", "support" ] }
    ),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new AlwaysBlock(),
    )
  ),
  new BasicPolicy(
    "Complex matcher viewtime block",
    false,
    new AndMatcher([
      new FrameContextMatcher(FrameContext.ROOT),
      new NotMatcher(new OrMatcher([
        new PageOwnerMatcher(PageOwner.SELF),
        new DomainMatcher("example.com", { include: [] }),
        new DomainMatcher("www.microsoft.com", { include: [] }),
        new DomainMatcher("stackoverflow.com", { include: [] }),
      ]))
    ]),
    new ScheduledLimit(
      new PeriodicSchedule([new PeriodicInterval(
        PeriodicTime.fromString("20"),        
        PeriodicTime.fromString("10"),        
      )]),
      new ViewtimeCooldownLimit(10000, 15000),
    ),
  ),
  new BasicPolicy(
    "en.wikipedia.org window block",
    true,
    new DomainMatcher("en.wikipedia.org", { include: [] }),
    new ScheduledLimit(
      new PeriodicSchedule([new PeriodicInterval(
        PeriodicTime.fromString("20"),
        PeriodicTime.fromString("10"),        
      )]),
      new WindowCooldownLimit(10000, 15000),
    ),
  ),
  new BasicPolicy(
    "Block HackerNews after 1 seconds",
    true,
    new DomainMatcher("news.ycombinator.com", { include: [] }),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new WindowCooldownLimit(1_000, 1_000)
    ),
  ),
  new BasicPolicy(
    "Limit CNBC during work hours on weekdays",
    true,
    new DomainMatcher("www.cnbc.com", { include: [] }),
    new ScheduledLimit(
      new PeriodicSchedule(
        ["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => new PeriodicInterval(
          PeriodicTime.fromString(`${day} 08:00:00`),
          PeriodicTime.fromString(`${day} 16:00:00`),
        ))
      ),
      new AlwaysBlock(),
    ),
  ),
].map((policy, index) => new BasicGuard(String(index), policy, new BasicPage()));
