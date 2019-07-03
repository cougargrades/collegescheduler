
const { URLSearchParams } = require('url');
const nodeFetch = require('node-fetch');
const fetch = require('fetch-cookie/node-fetch')(nodeFetch)

const HOST = 'https://saprd.my.uh.edu'

const wrong = false;

console.log(wrong ? '[❌] WRONG' : '[🔒] REAL')

console.log('[💬] Login https://my.uh.edu ...')
// MY.UH.EDU LOGIN
fetch(`${HOST}/psp/saprd/UHM_SITE/SA/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?cmd=login`, {
    method: 'POST',
    body: new URLSearchParams({
        'userid': 'redacted',
        'pwd': 'redacted'
    }) 
})
.then(res => {
    //console.log(JSON.stringify(res))
    //console.log(res.headers)
    console.log(`\tstatus code: ${res.status}`)
    console.log(`\tredirected: ${res.redirected}`)
    console.log(`\turl: ${res.url}`)
    
    console.log(res.headers['respondingwithsignonpage'] ? '[⛔] Denied' : '[✅] Logged in!')


    // UH.COLLEGESCHEDULER.COM TRANSFER
    console.log('[💬] Transfer token ...')
    fetch(`${HOST}/psc/saprd/UHM_SITE/SA/c/PRJCS_MENU.PRJCS_SCHD_STRT.GBL`, {
        method: 'POST',
        body: new URLSearchParams({
            FacetPath: "None",
            ICAJAX: "1",
            ICAction: "PRJCS_DERIVED_PRJCS_LAUNCH_CS",
            ICActionPrompt: "false",
            ICAddCount: "",
            ICAppClsData: "",
            ICAutoSave: "0",
            ICBcDomData: "C~UnknownValue~UHM_SITE~SA~NUI_FRAMEWORK.PT_LANDINGPAGE.G…ENU.PRJCS_SCHD_STRT.GBL\"%\"3FAction\"%\"3DU~UnknownValue",
            ICChanged: "0",
            ICElementNum: "0",
            ICFind: "",
            ICFocus: "",
            ICModelCancel: "0",
            ICNAVTYPEDROPDOWN: "1",
            ICPanelName: "",
            ICResubmit: "0",
            //ICSID: "CNEeWkkypipf\"%\"2BjUk5RI7Z0WZCcPjYK4bbPjwefzKHj4\"%\"3D",
            ICSaveWarningFilter: "0",
            ICSkipPending: "0",
            ICStateNum: "8",
            ICType: "Panel",
            ICXPos: "0",
            ICYPos: "0",
            ResponsetoDiffFrame: "-1",
            TargetFrameName: "None",
        })
    })
    .then(res => {
        console.log('\t', res.headers)
        console.log(`\tstatus code: ${res.status}`)
        console.log(`\tredirected: ${res.redirected}`)
        console.log(`\turl: ${res.url}`)
        console.log(`\tcontent-size: ${res.headers.get('Content-Length')}`)
        return res.text()
    })
    .then(text => {
        //console.log(text)
    })





})


