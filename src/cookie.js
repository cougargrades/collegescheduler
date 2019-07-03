
const tough = require('tough-cookie');

module.exports = {
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

/*

PUPPETEER

{ name: '__RequestVerificationToken',
    value:
     'YfTaaZogwqXtvwbRiTGIBDHeGaS8l4zxQWFt_ptiJZ3e5h1Duss1ZsGDHfmollj0e7yMKnvoV1Bw-pdUqBprEWP09a81',
    domain: 'uh.collegescheduler.com',
    path: '/',
    expires: -1,
    size: 118,
    httpOnly: true,
    secure: true,
    session: true }


TOUGH

Cookie object properties:

    key - string - the name or key of the cookie (default "")
    value - string - the value of the cookie (default "")
    expires - Date - if set, the Expires= attribute of the cookie (defaults to the string "Infinity"). See setExpires()
    maxAge - seconds - if set, the Max-Age= attribute in seconds of the cookie. May also be set to strings "Infinity" and "-Infinity" for non-expiry and immediate-expiry, respectively. See setMaxAge()
    domain - string - the Domain= attribute of the cookie
    path - string - the Path= of the cookie
    secure - boolean - the Secure cookie flag
    httpOnly - boolean - the HttpOnly cookie flag
    extensions - Array - any unrecognized cookie attributes as strings (even if equal-signs inside)
    creation - Date - when this cookie was constructed
    creationIndex - number - set at construction, used to provide greater sort precision (please see cookieCompare(a,b) for a full explanation)


*/