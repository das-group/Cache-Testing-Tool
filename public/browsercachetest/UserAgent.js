/**
 * Detect browser and os from UA
 */
const os = {
    "ipad" : "iPad",
    "ipod" : "iPod",
    "iphone" : "iPhone",
    "windows nt 10" : "Windows 10",
    "windows nt 6.1" : "Windows 7",
    "windows nt 6.2" : "Windows 8",
    "windows nt 6.3" : "Windows 8",
    "windows phone 10" : "Windows Mobile",
    "windows phone" : "Windows Phone",
    "windows" : "Windows",
    "android" : "Android",
    "mac" : "Mac",
    "ubuntu" : "Ubuntu",
    "linux" : "Linux",
    "bada" : "Bada",
    "meego" : "MeeGo",
};

const browser = {
    "crios" : "CriOS",
    "fxios" : "FxiOS",
    "wv" : "WebKit",
    "edge" : "EDGE",
    "chrome" : "Chrome",
    "firefox" : "Firefox",
    "msie" : "Internet Explorer",
    "opera" : "Opera",
    "trident" : "Trident",
    "safari" : "Safari",
};

const mobile = [
    'mobile', 'ipad', 'ipod', 'iphone'
];


class UserAgent {

    static parseUserAgent(user_agent) {
        return {
            "os" : UserAgent.getOs(user_agent),
            "browser" : UserAgent.getBrowser(user_agent),
            "mobile" : UserAgent.isMobile(user_agent)
        };
    };

    static getOs(user_agent) {
        for(let key in os) {
            if(user_agent.toLowerCase().indexOf(key) !== -1) {
                return os[key];
            }
        }
        return '';
    };

    static getBrowser(user_agent) {
        for(let key in browser) {
            if(user_agent.toLowerCase().indexOf(key) !== -1) {
                let regexp = new RegExp(".*(" + browser[key] + ")\/([0-9\.]+).*", 'i');
                return user_agent.replace(regexp, "$1/$2");
            }
        }
        return '';
    };

    static isMobile(user_agent) {
        for(let i = 0; i < mobile.length; i++) {
            if(user_agent.toLowerCase().indexOf(mobile[i]) !== -1) {
                return true;
            }
        }
        return false;
    };
};
