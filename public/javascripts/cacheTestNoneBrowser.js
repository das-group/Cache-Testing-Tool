var webSocket = null;


$("#start").click(function(e){
    if($("#start").hasClass("disabled")){
        return;
    }
    startCacheTest();
});

$("#continue").click(function(e){
    if($(this).hasClass("disabled")){
        return;
    }
   initConnection();
});

$("#stop").click(function(){
    if($(this).hasClass("disabled")){
        return;
    }
    webSocket.close();
})

function initConnection() {
    var testCaseName = "";
    webSocket = new WebSocket("ws://localhost:9000/socket");

    webSocket.onopen = function(e){
        sendNextTestCase()
    }

    webSocket.onmessage = function (e){

        $("#start").addClass("disabled");

        $("#stop").removeClass("disabled");

        if(e.data == "finish"){
            testCaseCounter++;
            $(".testCaseCounter").text(testCaseCounter)
            $("#progressTestCases").attr("aria-valuenow",testCaseCounter);
            var progressTestCases = (testCaseCounter/numberOfTestCases) * 100
            $("#progressTestCases").css("width",`${progressTestCases}%`);
            $("#progressTestCases").text(progressTestCases.toFixed(2) + "%");

            if(testCaseCounter < numberOfTestCases){
                sendNextTestCase();
            } else if(testCaseCounter == numberOfTestCases) {
                $("#start").removeClass("disabled");
                $("#stop").add("disabled");
                $('#testCasesFinishedModal').modal('show');
            }

        } else if(e.data == "Connection problem") {
            $("#server").addClass("is-invalid");
            webSocket.close();
        } else {

            try{
                var testCaseObject = JSON.parse(e.data);

                // A new test case
                if(testCaseObject.name){
                    testCaseName = testCaseObject.name;
                    testCase = {};
                    testCase.name = testCaseObject.name;
                    testCase.number = testCaseObject.number;
                    testCase.timestamp = testCaseObject.timestamp;
                    testCase.requestResponseDefinitions = [];
                    testCasesObject[testCase.number] = testCase;

                    var number = testCase.number;

                    var numberArray = number.split(".").length > 1 ? number.split(".") : [8,4,1];
                    var numberUnderscored = numberArray.join("_");
                    numberArray.pop();
                    var parentNumber = numberArray.join("_");
                    $("#testArea").append(`<table class="table table-bordered ${testCase.timestamp}"><thead></thead><tbody></tbody></table>`);
                    if($(`#${numberUnderscored}`).length){
                        $(`#${numberUnderscored}`).html(`<table class="table table-bordered ${testCase.timestamp}"><thead></thead><tbody></tbody></table>`);
                    } else {
                        $(`#${parentNumber}`).append(`<div id="${numberUnderscored}"><table class="table table-bordered ${testCase.timestamp}"><thead></thead><tbody></tbody></table></div>`);
                    }

                    $(`table.${testCase.timestamp} thead`).append(renderTestCaseNameRow(testCase.name));

                } else if(testCaseObject.request && testCaseObject.response){
                    $(`table.${testCase.timestamp} tbody`).append(renderRequestResponseRow(testCaseObject, testCaseName));
                    testCase.requestResponseDefinitions.push(testCaseObject);
                    ++requestCounter;
                    $(".requestCounter").text(requestCounter);
                    $("#progressRequests").attr("aria-valuenow",requestCounter);
                    var progressRequests = (requestCounter/numberOfRequests) * 100;
                    $("#progressRequests").css("width",`${progressRequests}%`);
                    $("#progressRequests").text(progressRequests.toFixed(2) + "%");

                }
            } catch(e){
                console.log(e);
            }

        }

    }

    webSocket.onclose = function (e){
        $("#start").removeClass("disabled");
        $("#continue").removeClass("disabled");
        $("#stop").addClass("disabled");

        if(!e.wasClean){
            if(failCounter < 3){
                failCounter++;
            } else {
                failCounter = 0;
                testCaseCounter++;
            }

            initConnection();
        }
    }
}

function startCacheTest(){
    if(!checkRequiredInput()){
        return;
    }

    $(".requestCounter").text(0);
    requestCounter = 0;
    numberOfErrors = 0;
    $("#progressRequests").attr("aria-valuenow",0);
    $("#progressRequests").css("width",`${0}%`);
    $("#progressRequests").text(0 + "%");

    $(".testCaseCounter").text(0);
    $("#progressTestCases").attr("aria-valuenow",0);
    $("#progressTestCases").css("width",`${0}%`);
    $("#progressTestCases").text(0 + "%");

    $('#testArea').html("");
    $('#nonComplianceList').html("");
    testCaseCounter = 0;

    cacheTestObject.name = $("#name").val();
    cacheTestObject.server = $("#server").val();
    cacheTestObject.forwardProxy = $("#forwardProxy").val();
    cacheTestObject.testCases = testCasesObject;
    cacheTestObject.tl = $("input[name='tl']:checked").val();
    testCasesToArray();
    initConnection();
}


function sendNextTestCase(){

    if(webSocket.readyState == 1){
        var server = $('#server').val();
        var forwardProxy = $("#forwardProxy").val().length > 0 ? $("#forwardProxy").val().toString() : "";
        var tl = $("input[name='tl']:checked").val();
        var testCaseObject = {
            server : server,
            forwardProxy : forwardProxy,
            tl : tl,
            testCases: testCasesArray[testCaseCounter]
        }
        webSocket.send(JSON.stringify(testCaseObject));
    }
}


function testCasesToArray(){
    testCasesArray = [];
    var testCaseLines = $('#testcases').val().split("\n");
    var testCase = "";
    for (var i = 0; i < testCaseLines.length; i++) {
        if (testCaseLines[i].startsWith("##")) {
            if(testCase != ""){
                testCasesArray.push(testCase);

            }
            testCase  = testCaseLines[i] + "\n";


        } else if (testCaseLines[i].startsWith("GET") || testCaseLines[i].startsWith("POST") || testCaseLines[i].startsWith("PUT") || testCaseLines[i].startsWith("DELETE") || testCaseLines[i].startsWith("PATCH")) {

            testCase += testCaseLines[i] + "\n";
        }

    }

    if(testCase != ""){
        testCasesArray.push(testCase);
    }
}

$("body").on("click",".startLine",function(){
    var requestHeaderId = $(this).attr("rid");
    var responseBodyId = $(this).parent().find("span.responseBody").attr("bid");
    var tbody = $(this).parent().parent().parent();

    var message = $(this).parent();


    var messages = tbody.find(".message");
    messages.removeClass("danger");
    messages.removeClass("success");
    messages.each(function(index,element){
        var requestHeaderIdOfElement = $(element).attr("rid");
        if($(element).hasClass("response")){
            var responseBodyIdOfElement = $(element).find("span.responseBody").first().attr("bid");
            if(responseBodyIdOfElement == requestHeaderId ){
                $(element).addClass("danger");
            }
        }

        if(requestHeaderIdOfElement == requestHeaderId){
            $(element).removeClass("danger");
            $(element).addClass("success");
        } else if(requestHeaderIdOfElement == responseBodyId){
            $(element).addClass("danger");
        }
    });
});