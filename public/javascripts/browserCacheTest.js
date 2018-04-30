

var testCase, tester;
var currentTestCase = {};
var testSuiteBrowser = {
    collection: []
}
var testSuite;

function convert(topics, browserTopic){


    if(topics instanceof Array || topics.length > 0){

        var collections = [];
        for (var i = 0; i < topics.length; i++) {
            var name = topics[i]["name"];
            var number = topics[i]["number"];

            var collection = {
                name : name,
                id: number
            }


            if(topics[i]["subtopics"]){
                convert(topics[i]["subtopics"],collection)
            } else if(topics[i]["testCases"]){
                collection.tests = parse(topics[i]["testCases"])
            }

            if(!browserTopic.collection)
                browserTopic.collection = [];
            browserTopic.collection.push(collection);


        }


        return collections;
    }

    return;
}

function parse(content) {
    var tests = [];
    var tmp = [];
    var lines = content.split("\n");
    var regext_t = /[ ;]t:/;

    for(let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/\r/, "");
        if(line.trim() == "") {
            continue;
        }

        if(line.substr(0, 2) == "##") {
            if(Object.keys(tmp).length > 0) {
                tests.push(tmp);
            }

            tmp = {
                'name' : line,
                'id' : line.replace(/#[\#\s]*([\d\.]+).*/gm, "$1"),
                'steps' : [],
            };
            continue;
        }
        if(/s-max/.test(line) === true) {
            tmp.sharedCache = true;
        }
        if(line.substr(0, 1) != "#") {
            let step = this.parseStep(line);
            if(step.params && step.params.s && (regext_t.test(" " + step.params.s))) {
                tmp.hasTerminate = true;
            }
            tmp.steps.push(step);
        }
    }

    if(Object.keys(tmp).length > 0) {
        tests.push(tmp);
        tmp = [];
    }
    return tests;
};


function parseStep(step) {
    // extract params from url
    var [tmp, method, url, params_string] = step.match(/([A-Z]+)\s*([^ ]+)(.*)/);

    var params = {};
    // split by receiver
    var matches = params_string.split(/ (-\w{1,2})/);

    for(let i = 0; i < matches.length; i++) {
        let key = matches[i].trim();
        let name = key.substr(1);
        if((name.length == 1 || name.length == 2) && key.substr(0, 1) == "-" && (i + 1) < matches.length) {
            let value = matches[i + 1].trim();
            if (value != "") {
                if(name === "e" || name === "ep") {
                    params[name] = (params[name]) ? params[name] : [];

                    params[name].push(value.replace(/['"](.*)['"]/, "$1"));
                } else {
                    if(!params[name]) {
                        params[name] = "";
                    } else {
                        params[name] += ";";
                    }
                    params[name] += value.replace(/['"](.*)['"]/, "$1");
                }
            }
            i++;
        }
    }

    // expection for private caches
    if(params['ep']) {
        params['e'] = params['ep'];
    }
    return {
        url : url,
        method : method,
        params : params,
    };
};


/**
 * Log to HTMLElement
 * @param {string} msg
 * @param {string} status
 */
function log(msg, status) {
    // var console = document.querySelector('.console code');
    // var div = document.createElement('div');
    // div.className = "log " + (status ? status : "");
    // div.innerHTML = '<span class="date">' + +new Date() + ":</span> " + msg;
    // console.insertAdjacentElement('afterbegin', div);
};


/**
 * Header-String to Object
 * @param {string] header
 * @reutn {Object}}
 */
function parseHeader(header){
    //TODO parsing with spaces
    var headerArray = header.split(";");
    var response = {};
    for (var i = 0; i < headerArray.length; i++) {
        var headerFieldArray = headerArray[i].split(":");
        if(headerFieldArray.length == 2){
            // if value in headerFields, it shuld be used from the previous request
            if(headerFields[headerFieldArray[1]] && tester.step > 0) {
                var step = testCase.getTest(testCase.current).steps[tester.step - 1];
                if(step && step.respondedHeader && step.respondedHeader[headerFields[headerFieldArray[1]]]) {
                    response[headerFieldArray[0]] = step.respondedHeader[headerFields[headerFieldArray[1]]]
                }
            } else {
                response[headerFieldArray[0]] = headerFieldArray[1];
            }
        }
    }

    return response;
};

var headerFields = {
    "cc":"Cache-Control",
    "et":"ETag",
    "ex":"Expires",
    "va":"Vary",
    "ac" : "Accept",
    "al" : "Accept-Language",
    "lm":"Last-Modified",
    "ims": "If-Modified-Since",
    "ius": "If-Unmodified-Since",
    "im" : "If-Match",
    "inm": "If-None-Match",
    "pragma": "Pragma",
    "az": "Authorization",
    "ir": "If-Range",
    "ra": "Range",
    "id" : "X-Id",
    "exp" : "Expires",
    "sc" : "Set-Cookie",
    "cl" : "Content-Length"
};

function parseAllResponsedHeader(allRespondedHeader){
    var responseHeaderFields = {};
    var headerLines = allRespondedHeader.split("\n");
    for (var i = 0; i < headerLines.length; i++){
        if(headerLines[i] == ""){
            continue;
        }
        var headerLine = headerLines[i].split(":");
        var headerName = headerLine.shift();
        //responseHeaderFields[headerLine[0]] = headerLine[1].toString().trim();
        responseHeaderFields[headerName] = headerLine.join(":");
    }

    return responseHeaderFields;
}

function getMaxAge(maxAgeString){
    var maxAge = 0;
    if(maxAgeString.includes("max-age=")){

        var paramsArray = maxAgeString.split(",");
        for (var i = 0; i < paramsArray.length; i++) {
            var keyValueArray = paramsArray[i].split("=");
            if(keyValueArray[0] == ("max-age")){
                maxAge = parseInt(keyValueArray[1]);


            }

        }
    }


    return maxAge;
}