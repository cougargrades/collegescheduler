uhcollegescheduler-proxy
========================
📅📡 Local reverse-proxy to UH CollegeScheduler API that can be re-authenticated automatically to consistently access up-to-date course schedules and catalog data.

<hr>

## Modules

### Webserver

Proxies unauthenticated requests to the local webserver to `https://uh.collegescheduler.com/` with your cookie attached.

The webserver will automatically refresh the cookie with Puppet.js when the current one is expired, leaving no interruptions to API requests.

_Note: Do not leave the local server exposed to the open internet because every unauthenticated client acts on your behalf._

### Puppet.js
puppet.js uses [`puppeteer`](https://github.com/GoogleChrome/puppeteer/) to crawl my.uh.edu, portal to collegescheduler.com, and extract the cookies for use.

<hr>

## Usage

_Note: Some environments will require [troubleshooting with puppeteer](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md)._

### Webserver

#### Run inside Docker
How you supply environment variables to the Docker image depends on your workflow, but my preferential way is:

- Create an `.env` file that is a copy of [`.env.example`](.env.example) with your own information.

https://github.com/au5ton/uhcollegescheduler-proxy/blob/1bad1e9fc612d5a92f76db8d8f10d3aea12710ed/.env.example#L1-L3

- Start a new container: 

`docker run -i --env-file .env -p 3003:3003 github.com/au5ton/uhcollegescheduler-proxy`

#### Standalone
- _Prerequisite: Make sure Puppet.js functions as intended and has no errors before starting the proxy server. See guide below._
- Install dependencies: `npm install`
- Specify desired port in `.env` or with variable `PROXY_SERVER_PORT`.
- Run server: `npm run server`

<hr>

### Puppet.js

#### Command-line tool
- With npm:
    - Install tool: `npm install -g au5ton/uhcollegescheduler-proxy`
    - Run tool: `npx uhcs_puppet --help`
- Cloning directly:
    - `git clone https://github.com/au5ton/uhcollegescheduler-proxy.git`
    - `cd uhcollegescheduler-proxy/`
    - Install dependencies: `npm install`
    - Run tool: `./src/puppet.js --help`
- Copy example file: `cp .env.example .env`
- Edit `.env` file with login details
    - Or:
    - Specify the environment variables in your shell:
    - `$ MY_UH_PEOPLESOFT_ID=1234567`
    - `$ MY_UH_PASSWORD=hunter2`
- Follow instructions on running in the `--help` page.

```
$ ./src/puppet.js -o cookiejar.json

[💬] Login https://my.uh.edu ...
[✅] Logged in!
[💬] Portalling (Student Center -> Schedule Planner) ...
[📝] Extracting cookies https://uh.collegescheduler.com ...
[✅] API access confirmed
[🍪] CookieJar written to cookiejar.json

$ cat cookiejar.json
{
 "version": "tough-cookie@3.0.1",
 ...
 "cookies": [
  {
   "key": "__RequestVerificationToken",
   "value": "...",
    ...
  },
  {
   "key": ".AspNet.Cookies",
   "value": "...",
   ...
  }
 ]
}
```

#### Node module
- Developed with Node 10. Must support ES7 `async/await` and maybe other features.
- Install dependency: `npm install au5ton/uhcollegescheduler-proxy`
- Sample code:

```javascript
const { Puppet } = require('uhcollegescheduler-proxy')

let options = {
    logging: true, // [true | false]
    format: 'set-cookie' // ['jar' | 'set-cookie']
}

let cookie = await Puppet.extract('177554', 'secretpassword', options)

console.log(cookie) // '__RequestVerificationToken=abcdef; AspNet.Cookies=uvwxyz'
```

<hr>

Reference:
- _[uh.edu/about/offices/enrollment-services/registrar/schedule-planner/](https://www.uh.edu/about/offices/enrollment-services/registrar/schedule-planner/)_
- _[uh.collegescheduler.com](https://uh.collegescheduler.com/)_
