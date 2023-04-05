# Bouncer: A Ridiculously Configurable Browsing Limiter

The browser extension I've always wanted for limiting browsing activity.

## Overview

*Note: this extension is in active development. The information below may be outdated, or detail features yet to be added.*

Bouncer is an extension that offers granular control over browsing activity. Users can identify a set of sites/pages to limit access to and apply a custom limit to those sites.

There are currently three types of limits:

- *Always Block:* Always block any of the affected sites. 
- *Viewtime Limit:* Affected sites share an allotment of viewtime. Viewtime is consumed when the user focuses an affected site. Once viewtime is fully consumed, all affected sites are blocked.
- *Window Limit:* A countdown begins the first time the user visits one of the affected sites. Once the countdown is over, all affected sites are blocked.

Additionally, users can configure a schedule for limits. This means that limits only apply to the page when the schedule is active. For example: a user could schedule a limit to only apply during working hours on weekdays.

Bouncer currently only functions as a Firefox extension, and can only be run in a development context.


## Development Info

### Environment setup

To set up your development environment:

1. Clone this repository.
2. Run `npm install`.

### Building/testing

To run all tests, run `npm test`.

To build Bouncer, run `npm run build`.

### Running

To run Bouncer, you'll need the Firefox browser (a requirement of the `web-ext` tool).

1. Run `npm run dev`. A new Firefox window should pop up. At this point, any changes made to code will trigger a Rollup rebuild, and `web-ext` will automatically refresh the running extension.
2. Find Bouncer in the extensions menu. Go to `Settings (Gear Icon) > Manage Extension`. Under the `Permissions` tab, allow Bouncer to "Access your data for all websites".
3. Bouncer is now ready to use. To test, click on the extension and open its configuration menu. Set a limit for the desired website, then head to the site and wait for it to be blocked.

### Code tour

The entrypoints for Bouncer are [`bouncerContent`](src/content/bouncerContent.ts) and [`bouncerBackground`](src/background/bouncerBackground.ts). These define, respectively:
- A script that runs on each page to record events (page visits, shows, hides, visibility, etc.), message the background script, and affect blocks.
- A service worker that receives events from the content scripts, updates relevant state, and replies with any actions to take.

The primary unit of information is the [policy](src/lib/policy), which represents a collection of limited sites, what limit is applied to them, and the current state of the sites affected by the policy. Most of the Bouncer library code serves to implement the policy.

The [page](src/lib/page) is an especially important data type that encapsulates the state of a limited page/set of pages. The metrics provided by pages are used by limits to determine whether a page should be blocked.
