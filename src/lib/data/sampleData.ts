import { ScheduledLimit } from "@bouncer/enforcer";
import { BasicGuard } from "@bouncer/guard";
import { ViewtimeCooldownLimit, WindowCooldownLimit, AlwaysBlock } from "@bouncer/limit";
import { AndMatcher, ExactHostnameMatcher, LevelMatcher, NotMatcher, OrMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { BasicPolicy } from "@bouncer/policy";
import { MinuteSchedule, AlwaysSchedule, PeriodicSchedule } from "@bouncer/schedule";
import { Period, PeriodicInterval } from "@bouncer/time";
import { PartialTime } from "@bouncer/time";

export const sampleGuards = [
  new BasicPolicy(
    "Complex matcher viewtime block",
    true,
    new AndMatcher([
      new LevelMatcher("ROOT"),
      new NotMatcher(new OrMatcher([
        new ExactHostnameMatcher("example.com"),
        new ExactHostnameMatcher("www.microsoft.com"),
        new ExactHostnameMatcher("stackoverflow.com"),
      ]))
    ]),
    new ScheduledLimit(
      new MinuteSchedule(30, 10),
      new ViewtimeCooldownLimit(10000, 15000),
    ),
  ),
  new BasicPolicy(
    "en.wikipedia.org window block",
    true,
    new ExactHostnameMatcher("en.wikipedia.org"),
    new ScheduledLimit(
      new MinuteSchedule(30, 10),
      new WindowCooldownLimit(10000, 15000),
    ),
  ),
  new BasicPolicy(
    "Block HackerNews after 45 seconds",
    true,
    new ExactHostnameMatcher("news.ycombinator.com"),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new WindowCooldownLimit(45_000, 10_000)
    ),
  ),
  new BasicPolicy(
    "Limit CNBC during work hours on weekdays",
    true,
    new ExactHostnameMatcher("www.cnbc.com"),
    new ScheduledLimit(
      new PeriodicSchedule(
        "week",
        [1, 2, 3, 4, 5].map(day => new PeriodicInterval(
          "week",
          new PartialTime({ day: day, hour: 8, }),
          new PartialTime({ day: day, hour: 16, }),
        ))
      ),
      new AlwaysBlock(),
    ),
  ),
].map(policy => new BasicGuard(crypto.randomUUID(), policy, new BasicPage()));
