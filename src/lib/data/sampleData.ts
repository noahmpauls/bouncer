import { ScheduledLimit } from "@bouncer/enforcer";
import { FrameContext, PageOwner } from "@bouncer/events";
import { BasicGuard } from "@bouncer/guard";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { AndMatcher, DomainMatcher, ExactHostnameMatcher, FrameContextMatcher, NotMatcher, PathPrefixMatcher, OrMatcher, PageOwnerMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { PeriodicInterval, PeriodicTime } from "@bouncer/period";
import { BasicPolicy } from "@bouncer/policy";
import { AlwaysSchedule, PeriodicSchedule } from "@bouncer/schedule";

export const sampleGuards = [
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
        new ExactHostnameMatcher("example.com"),
        new ExactHostnameMatcher("www.microsoft.com"),
        new ExactHostnameMatcher("stackoverflow.com"),
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
    new ExactHostnameMatcher("en.wikipedia.org"),
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
    new ExactHostnameMatcher("news.ycombinator.com"),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new WindowCooldownLimit(1_000, 1_000)
    ),
  ),
  new BasicPolicy(
    "Limit CNBC during work hours on weekdays",
    true,
    new ExactHostnameMatcher("www.cnbc.com"),
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
].map(policy => new BasicGuard(crypto.randomUUID(), policy, new BasicPage()));
