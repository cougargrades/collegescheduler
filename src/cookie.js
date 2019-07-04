
const tough = require('tough-cookie');

module.exports = {
    // Converts puppeteer cookie value to a tough.Cookie
    puppeteerToTough: cookie => {
        return new tough.Cookie({
            key: cookie.name,
            value: cookie.value,
            expires: cookie.expires === -1 ? Infinity : new Date(cookie.expires),
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly
        })
    }
};