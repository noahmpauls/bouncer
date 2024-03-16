import { ScheduledLimit } from "@bouncer/enforcer";
import { BasicGuard } from "@bouncer/guard";
import { ViewtimeCooldownLimit, WindowCooldownLimit, AlwaysBlock } from "@bouncer/limit";
import { ExactHostnameMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { BasicPolicy } from "@bouncer/policy";
import { MinuteSchedule, AlwaysSchedule, PeriodicSchedule } from "@bouncer/schedule";

export const sampleGuards = [
  new BasicPolicy(
    "example.com viewtime block",
    true,
    new ExactHostnameMatcher("example.com"),
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
    "Limit CNBC during work hours",
    true,
    new ExactHostnameMatcher("www.cnbc.com"),
    new ScheduledLimit(
      new PeriodicSchedule(
        "day",
        [
          { start: 2.88e+7, end: 6.12e+7 }
        ]
      ),
      new AlwaysBlock(),
    ),
  ),
].map(policy => new BasicGuard(crypto.randomUUID(), policy, new BasicPage()));
