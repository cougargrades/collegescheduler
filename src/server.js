#!/usr/bin/env node
require('dotenv').config()
const express = require('express')
const app = express()
const NAME = require('../package.json').name
const Puppet = require('./puppet.js')
const interval = require('interval-promise')
const fetch = require('node-fetch')

// const proxy = async (req, res, next) => {
//     console.log('API:', req.originalUrl)
//     let settings = { // passthrough settings
//     method: req.method,
//     body: req.body,
//     headers: {
//         cookie: req.headers.cookie
//     },
//     credentials: 'include'
//     }
//     try {
//     let response = await fetch(process.env.REVERSE_PROXY_URL + req.originalUrl.split('/api')[1], settings)
//     if (!response.ok) {
//         throw new Error('Bad response from server:', response.message)
//     }
//     let data = await response.json()
//     res.send(data)
//     } catch (err) {
//     console.log(err.message)
//     res.status(500).send(err.message)
//     }
// }

// app.use('/api/*', proxy)
// app.get('/meta', (req, res) => res.json(`Hello, ${NAME}!`))

// let cookie = await 

// app.listen(process.env.PROXY_SERVER_PORT, (a,b) => console.log(`Example app listening on port ${process.env.PROXY_SERVER_PORT}!`))

const hoursToMs = (h) => h * 60 * 60 * 1000
const stamp = () => `[${new Date().toLocaleTimeString("en-US", {year: "numeric", month: "short", day: "2-digit"})}]`

const HOST = 'https://uh.collegescheduler.com'

class ProxyServer {
    /**
     * 
     * @param {string} psid - MyUH PeopleSoft ID
     * @param {string} password - MyUH password
     */
    constructor(psid, password) {
        this.APP_NAME = require('../package.json').name
        // Init credentials
        this.psid = psid.slice()
        this.password = password.slice()
        this.cookie = null
        this.fetchOpt = {
            redirect: 'manual',
            headers: {
                Cookie: this.cookie
            }
        };
        this.timerEnable = true
        this.timerKill = false
        this.timerFirstRun = true
        this.refresh()
        interval(this.keepalive.bind(this), 5 * 1000) // Keep-alive interval of 45 seconds 
    }
    async refresh(iteration, stop) {
        if(this.timerKill) stop()
        if(!this.timerEnable) return
        
        // For first-time init
        if(this.timerFirstRun === false) return
        if(this.timerFirstRun) this.timerFirstRun = false

        console.log(`${stamp()} ProxyServer#refresh() -> START`)

        try {
            let start = process.hrtime()
            this.cookie = (await Puppet.extract(this.psid, this.password, { logging: false, format: 'set-cookie' })).slice()
            this.fetchOpt = {
                headers: {
                    Cookie: this.cookie
                }
            };
            let end = process.hrtime(start)
            console.log(`${stamp()} ProxyServer#refresh() -> END (${end[0]}s ${end[1] / 1000000}ms)`)
        }
        catch(err) {
            console.log(`${stamp()} [⚠] ProxyServer#refresh() failed to refresh:\n`,err)
        }

        // For first-time init
        if(this.timerFirstRun === false) {
            console.log(`${stamp()} ProxyServer#refresh() -> END First Refresh`)
            delete this.timerFirstRun
        }
    }
    async keepalive(iteration, stop, depth) {
        // For first-time init
        if(this.timerFirstRun === false) return

        console.log(`${stamp()} ProxyServer#keepalive() -> START (depth: ${depth})`)
        depth = depth ? depth : 0
        let res = await fetch(`${HOST}/api/terms/`, this.fetchOpt)

        // If response doesn't go through, try at most 3 times again
        if(res.status !== 200 && depth < 3) {
            await this.refresh()
            await this.keepalive()
        }

        console.log(`${stamp()} ProxyServer#keepalive() -> END (depth: ${depth})`)
    }
    
};

module.exports.cli = async function() {
    if(!process.env.MY_UH_PEOPLESOFT_ID)
        console.log('[⛔] Must define MY_UH_PEOPLESOFT_ID in environment or .env file')
    if(!process.env.MY_UH_PASSWORD)
        console.log('[⛔] Must define MY_UH_PASSWORD in environment or .env file')
    if(!process.env.MY_UH_PEOPLESOFT_ID || !process.env.MY_UH_PASSWORD)
        process.exit(1)
    
    let server = new ProxyServer(process.env.MY_UH_PEOPLESOFT_ID, process.env.MY_UH_PASSWORD)
}

if (require.main === module) {
    module.exports.cli()
}

module.exports = ProxyServer;