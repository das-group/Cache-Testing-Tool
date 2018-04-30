var totalTestCases = 0;
var totalRequests = 0;

function renderTestSuiteNavi(topics){
    var html = "";
    if(topics instanceof Array || topics.length > 0){

        html += `<ul class='list'>`;
        for (var i = 0; i < topics.length; i++) {
            var name = topics[i]["name"];
            var number = topics[i]["number"];
            var numberHref = number.split(".").join("_")
            //var hrefCamelCase = camelize(topics[i]["name"]);
            html += `<li><a href="#${numberHref}" class="number"><span>${topics[i]["number"]}.</span> ${name}</a>`;
            if(topics[i]["subtopics"]){
                html += " <a class='collapseList' href='#'>" + " <span>&or;</span></a>";
                html += renderTestSuiteNavi(topics[i]["subtopics"]);
            } else if(typeof topics[i]["testCases"] !== "undefined"){
                var numberOfCurrentRequests = countRequests(topics[i]["testCases"]);
                totalRequests += numberOfCurrentRequests;
                var numberOfCurrentTestCases = countTestCases(topics[i]["testCases"]);
                totalTestCases += numberOfCurrentTestCases;
                html += ` <span>(${numberOfCurrentTestCases}, ${numberOfCurrentRequests})</span>`;
            }

            html += "</li>"
        }

        html+= "</ul>";
        return html;
    }
    return "";
}

function countTestCases(testCases){
    return(testCases.match(/##/g) || []).length
}

function renderTestSuiteMain(topics) {
    var html = "";
    if(topics instanceof Array || topics.length > 0){
        for (var i = 0; i < topics.length; i++) {

            var name = topics[i]["name"];
            var number = topics[i]["number"];
            var layerNumber = number.split(".").length;
            var numberHref = number.split(".").join("_")


            html += `<h${layerNumber}> ${number} ${name}</h${layerNumber}>`;
            html += `<div id="${numberHref}">`;

            if(topics[i]["subtopics"]){
                html += renderTestSuiteMain(topics[i]["subtopics"])
            } else if(typeof topics[i]["testCases"] !== "undefined"){
                if(topics[i]["references"]){
                    var references = topics[i]["references"];
                    html +=`<button class='btn btn-secondary btn-xs collapseReferences' data-target="#collapse${numberHref}" aria-expanded="false" aria-controls="collapse${numberHref}">Show references</button>`;

                    html +=`<div class='collapse' id='collapse${numberHref}' class="list-group-item"><ul class="list-group">`;
                    for (var j = 0; j < references.length; j++) {
                        var linkName = "";
                        if (typeof references[j] === "object") {
                            for (var key in references[j]) {
                                html +=`<li class="list-group-item"><a href=${references[j][key]} target="_blank">${key}</a></li>`;
                            };
                        } else if(typeof references[j] === "string" &&  references[j].startsWith("https://tools.ietf.org/html/rfc7234")){
                            var pathEnd = references[j].split("/")[4];
                            var pathEndArray = pathEnd.split("#");
                            var rfcNumber = pathEndArray[0].replace(/\D/g,'');
                            var sectionNumber = pathEndArray[1].replace("section-","");

                            linkName = `RFC ${rfcNumber} Section ${sectionNumber}`;


                            html +=`<li class="list-group-item"><a href=${references[j]} target="_blank">${linkName}</a></li>`
                        }
                    }
                    html +="</ul></div>";
                }
                if(topics[i]["testCases"] != ""){
                    var numberOfCurrentRequests = countRequests(topics[i]["testCases"]);
                    var numberOfCurrentTestCases = countTestCases(topics[i]["testCases"]);

                    html += ` <p class="lead">${numberOfCurrentTestCases} test cases and ${numberOfCurrentRequests} requests</p>`;
                    html +=`<pre><code class='cachetest'>${topics[i]["testCases"]}</code></pre>`


                } else {
                    html += "<pre><code>## No test cases</code></pre>";
                }

            }
            html +="</div>";
            if(layerNumber == 1 && i < (topics.length - 1)){
                html += "<hr/>";
            }
        };
    }

    return html;

}
renderTestSuite();

function renderTestSuite(){

    $.getJSON("/assets/testSuite/testSuite.json",function(testsuite){
        var navi = $("#navi");
        navi.html(renderTestSuiteNavi(testsuite));

        $(".totalRequests").html(totalRequests);
        $(".totalTestCases").html(totalTestCases);

        //convert(testsuite,testSuiteBrowser);

        var main = $("#main").html(renderTestSuiteMain(testsuite));
        $("#main").find("pre code").each(function(i, block){
            hljs.highlightBlock(block);
        });
    })
}

hljs.registerLanguage("javascript",javascript);
hljs.registerLanguage("cachetest",function(hljs){
    var syntax = {
        case_insensitive: true,
        // language is case-insensitive
        keywords: {
            keyword: 'GET PATCH POST',
            literal: "p s c e es ep",
        },
        contains: [

            {
                className: 'string',
                begin: "'", end: "'"
            },
            {
                className: 'link',
                begin : "/\\w+",
            },
            hljs.COMMENT(
                '#', // begin
                '\n',
                {
                    contains: [
                        {
                            className: 'doc', begin: '@\\w+'
                        }
                    ]
                }
            )
        ]
    }
    return syntax;
});

$("body").on("click",".collapseList", function(e){
    var list = $(this).next("ul.list")
    list.toggle();
})

$("body").on("click",".collapseReferences",function(){
    var collapseId = $(this).attr("data-target");
    $(collapseId).collapse("toggle");
});

function countTestCases(testCases){
    return(testCases.match(/##/g) || []).length
}

function countRequests(testCases){
    var numberOfRequests = 0;
    var testCaseLines = testCases.split("\n");

    for (var i = 0; i < testCaseLines.length; i++) {
        if (testCaseLines[i].startsWith("GET") || testCaseLines[i].startsWith("POST") || testCaseLines[i].startsWith("PUT") || testCaseLines[i].startsWith("DELETE") || testCaseLines[i].startsWith("PATCH")) {
            numberOfRequests++;
        }
    }
    return numberOfRequests;
}
