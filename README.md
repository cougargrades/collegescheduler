uhcollegescheduler-proxy
========================
📅📡 Local reverse-proxy to UH CollegeScheduler API that can be re-authenticated automatically to consistently access up-to-date course schedules and catalog data.

_See: [uh.collegescheduler.com](https://uh.collegescheduler.com/)_

## puppet.js

puppet.js uses [`puppeteer`](https://github.com/GoogleChrome/puppeteer/) to crawl my.uh.edu, portal to collegescheduler.com, and save the cookies to disk.

## proxy.js

proxy.js proxy webserver that forwards requests from `/` to `https://uh.collegescheduler.com/api/`

<hr>

puppeteer troubleshooting: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox