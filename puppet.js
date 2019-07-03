#!/usr/bin/env node
const argv = require('yargs')
    .option('outfile', {
        alias: 'o',
        default: 'cookiejar.json'
    })
    .describe('outfile', 'File where JSON CookieJar will be saved to')
    .argv

require('dotenv').config()
const fs = require('fs')
const puppeteer = require('puppeteer')
const tough = require('tough-cookie')
const cookieutil = require('./cookie')

const nodeFetch = require('node-fetch')

if(!process.env.MY_UH_PEOPLESOFT_ID)
    console.log('[⛔] Must define MY_UH_PEOPLESOFT_ID in environment or .env file')
if(!process.env.MY_UH_PASSWORD)
    console.log('[⛔] Must define MY_UH_PASSWORD in environment or .env file')
if(!process.env.MY_UH_PEOPLESOFT_ID || !process.env.MY_UH_PASSWORD)
    process.exit(1)

puppeteer.launch().then(async browser => {
    console.log('[💬] Login https://my.uh.edu ...')
    const page = await browser.newPage();
    await page.goto('https://my.uh.edu');

    // Select "UH Central"
    await page.waitFor('label[for=myuh]')
    await page.click('label[for=myuh]')

    // Type username
    await page.waitFor('#userid')
    await page.focus('#userid')
    await page.keyboard.type(process.env.MY_UH_PEOPLESOFT_ID)
    
    // Type password
    await page.waitFor('#pwd')
    await page.focus('#pwd')
    await page.keyboard.type(process.env.MY_UH_PASSWORD)

    // Submit button
    await page.waitFor('input[type=Submit]')
    promise = page.waitForResponse('https://saprd.my.uh.edu/psp/saprd/UHM_SITE/SA/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL')

    // Wait for login form to submit
    const [response] = await Promise.all([
        page.waitForNavigation(), // The promise resolves after navigation has finished
        page.click('input[type=Submit]'), // Clicking the link will indirectly cause a navigation
    ]);
    
    console.log(response.headers()['respondingwithsignonpage'] ? '[⛔] Denied' : '[✅] Logged in!')
    
    if(response.headers()['respondingwithsignonpage']) {
        console.log('closing browser because denied')
        await browser.close()
    }

    console.log('[💬] Portalling (Student Center -> Schedule Planner) ...')
    // "Student Center"
    await page.waitFor(`div[id='win0divPTNUI_LAND_REC_GROUPLET$3']`)
    await page.click(`div[id='win0divPTNUI_LAND_REC_GROUPLET$3']`)

    // inner peoplesoft iframe
    await page.waitFor('#ptifrmtgtframe')
    const frame = await page.frames().find(frame => frame.name() === 'TargetContent');
    //await frame.waitForNavigation()

    // "Schedule Planner"
    await frame.waitFor('#PRJCS_DERIVED_PRJCS_SCHD_PLN_PB')
    await frame.click('#PRJCS_DERIVED_PRJCS_SCHD_PLN_PB')
    
    // "Open Schedule Planner"
    await frame.waitFor('#win0divPRJCS_DERIVED_PRJCS_LAUNCH_CS')
    await frame.click('#win0divPRJCS_DERIVED_PRJCS_LAUNCH_CS')

    // Wait for tab Popup window to open
    await browser.waitForTarget(target => target.url().includes('collegescheduler'))

    // Select "page" that is what we're looking for
    const scheduler = (await browser.pages()).filter(e => e.url().includes('collegescheduler'))[0]

    // Wait for the page to load
    await scheduler.waitFor('#Term-options')

    console.log('[📝] Extracting cookies https://uh.collegescheduler.com ...')

    // Extract the cookies
    let pupcookies = await scheduler.cookies('https://uh.collegescheduler.com');
    let cookiejar = new tough.CookieJar();
    for(let i = 0; i < pupcookies.length; i++)
        cookiejar.setCookieSync(cookieutil.puppeteerToTough(pupcookies[i]), `${pupcookies[i].secure ? 'https://' : 'http://'}${pupcookies[i].domain}${pupcookies[i].path}`);
    
    const fetch = require('fetch-cookie/node-fetch')(nodeFetch, cookiejar)

    let res = await fetch('https://uh.collegescheduler.com/api/terms/')
    console.log(res.status !== 200 ? `[⚠] Faulty HTTP code: ${res.status}` : '[✅] API access confirmed')
    
    if(res.status !== 200) {
        console.log('closing because faulty http code')
        await browser.close()
    }

    try {
        // This times out for no fucking reason
        await browser.close()
    }
    catch(err) {
        //
    }

    fs.writeFileSync(argv.outfile, cookiejar.serializeSync())
    console.log(`[🍪] CookieJar written to ${argv.outfile}`)
});