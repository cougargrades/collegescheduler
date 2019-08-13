#!/usr/bin/env node
require('dotenv').config()
const express = require('express')
const app = express()
const NAME = require('../package.json').name
const Puppet = require('./puppet.js')
const interval = require('interval-promise')
const fetch = require('node-fetch')
const path = require('path')

const hoursToMs = (h) => h * 60 * 60 * 1000
const stamp = () => `[${new Date().toLocaleTimeString("en-US", {year: "numeric", month: "short", day: "2-digit"})}]`

const HOST = 'https://uh.collegescheduler.com'

class ProxyServer {
    /**
     * 
     * @param {options} params - { port: <number>, psid: <string>, password: <string>, logging: <number> }
     */
    constructor(params) {
        this.name = '@cougargrades/collegescheduler'
        this.port = params.port
        // Init credentials
        this.psid = params.psid.slice()
        this.password = params.password.slice()
        this.logging = params.logging
        this.cookie = null
        this.fetchOpt = {
            redirect: 'manual',
            headers: {
                cookie: this.cookie
            }
        };
        this.timerEnable = true
        this.timerKill = false
        this.timerFirstRun = true
        this.refresh()
        interval(this.keepalive.bind(this), 45 * 1000) // Keep-alive interval of 45 seconds 
    }
    /**
     * @param {iteration} - (Not used) interval-promise iteration number
     * @param {stop} - interval-promise function that stops the timer
     */
    async refresh(iteration, stop) {
        if(this.timerKill) stop()
        if(!this.timerEnable) return
        
        // For first-time init
        if(this.timerFirstRun === false) return
        if(this.timerFirstRun) this.timerFirstRun = false

        if(this.logging > 1) console.log(`${stamp()} ProxyServer#refresh() -> START`)

        try {
            let start = process.hrtime()
            this.cookie = (await Puppet.extract(this.psid, this.password, { logging: (this.logging > 2 ? true : false), format: 'set-cookie' })).slice()
            this.fetchOpt = {
                headers: {
                    cookie: this.cookie
                }
            };
            let end = process.hrtime(start)
            if(this.logging > 1) console.log(`${stamp()} ProxyServer#refresh() -> END (${end[0]}s ${end[1] / 1000000}ms)`)
        }
        catch(err) {
            console.log(`${stamp()} [⚠] ProxyServer#refresh() failed to refresh:\n`,err)
        }

        // For first-time init
        if(this.timerFirstRun === false) {
            if(this.logging > 1) console.log(`${stamp()} ProxyServer#refresh() -> END First Refresh`)
            delete this.timerFirstRun
        }
    }
    /**
     * @param {iteration} - (Not used) interval-promise iteration number
     * @param {stop} - interval-promise function that stops the timer
     * @param {depth} - retry count used when keepalive() fails and recursively calls
     */
    async keepalive(iteration, stop, depth) {
        // For first-time init
        if(this.timerFirstRun === false) return

        depth = depth ? depth : 0
        if(this.logging > 1) console.log(`${stamp()} ProxyServer#keepalive() -> START (depth: ${depth})`)
        let res = await fetch(`${HOST}/api/terms/`, this.fetchOpt)

        // If response doesn't go through, try at most 3 times again
        if(res.status !== 200 && depth < 3) {
            this.cookie = null // send HTTP/511 back to any requests while cookies are refreshed
            await this.refresh()
            await this.keepalive()
        }

        if(this.logging > 1) console.log(`${stamp()} ProxyServer#keepalive() -> END (depth: ${depth})`)
    }
    /**
     * Start the HTTP server
     */
    listen() {
        const proxy = async (req, res, next) => {
            if(!this.cookie) {
                // Safer to reply with 511 than hang require for 10-13 seconds while the cookie is refreshed
                // Cookies are refreshed automatically when the keepalive fails, so (ideally) someone shouldn't be met with this anyway
                res.status(511).json({ status: 511, msg: 'Network Authentication Required' })
                return
            }
            if(this.logging > 0) console.log(`${stamp()} API -> ${req.method} ${req.originalUrl}`)
            let settings = { // passthrough settings
                method: req.method,
                body: req.body,
                headers: {
                    cookie: this.cookie
                }
            }
            try {
                let response = await fetch(`${HOST}/${req.originalUrl}`, settings)
                if (!response.ok) {
                    throw new Error('Bad response from server:', response.message)
                }
                let data = await response.json()
                res.send(data)
            } catch (err) {
                console.log(err.message)
                res.status(502).send({ status: 502, msg: err.message })
            }
        }
        
        app.use('/api/*', proxy)
        app.get('/meta', (req, res) => res.json(`Hello, ${this.name}!`))
        
        
        interval((async (iteration, stop) => {
            console.log(`${stamp()} Waiting for first-run cookie ... ${iteration > 1 ? `[${iteration} / 10]` : ''}`)
            // Retry to listen for 10 attempts on server startup before giving up
            if(this.cookie === null && iteration < 10) return 
            if(iteration >= 10) {
                console.log(`${stamp()} First-run refresh took too long (10 checks over 50 seconds). Perhaps something is hung?`)
            }
            // Actually start the server
            app.listen(this.port, () => console.log(`${stamp()} ProxyServer listening on port ${this.port}!`))
            // Don't start the server again if conditions are met
            stop()
        }).bind(this), 5 * 1000)

        
    }
    
};

module.exports.cli = async function() {
    if(!process.env.MY_UH_PEOPLESOFT_ID)
        console.log('[⛔] Must define MY_UH_PEOPLESOFT_ID in environment or .env file')
    if(!process.env.MY_UH_PASSWORD)
        console.log('[⛔] Must define MY_UH_PASSWORD in environment or .env file')
    if(!process.env.MY_UH_PEOPLESOFT_ID || !process.env.MY_UH_PASSWORD)
        process.exit(1)
    
    let server = new ProxyServer({
        port: process.env.PROXY_SERVER_PORT ? process.env.PROXY_SERVER_PORT : 3003,
        psid: process.env.MY_UH_PEOPLESOFT_ID,
        password: process.env.MY_UH_PASSWORD,
        logging: 3 // Logging level [0,3]
    })
    server.listen()

    console.log('👋 Running server.js')
}

if (require.main === module) {
    module.exports.cli()
}

module.exports.ProxyServer = ProxyServer;