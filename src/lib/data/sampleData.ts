import { ScheduledLimit } from "@bouncer/enforcer";
import { BasicGuard } from "@bouncer/guard";
import { ViewtimeCooldownLimit, WindowCooldownLimit, AlwaysBlock } from "@bouncer/limit";
import { AndMatcher, ExactHostnameMatcher, FrameTypeMatcher, NotMatcher, OrMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { BasicPolicy } from "@bouncer/policy";
import { MinuteSchedule, AlwaysSchedule, PeriodicSchedule } from "@bouncer/schedule";
import { PeriodicInterval, PeriodicTime } from "@bouncer/period";

export const sampleGuards = [
  new BasicPolicy(
    "Complex matcher viewtime block",
    false,
    new AndMatcher([
      new FrameTypeMatcher("ROOT"),
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
