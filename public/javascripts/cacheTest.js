var failCounter = 0;
var numberOfTestCases = 0;
var numberOfRequests = 0;
var testCasesArray = [];
var testCasesObject = {};
var testCaseObject = {};
var cacheTestObject = {};
var requestCounter = 0;
var testCaseCounter = 0;
var testSuite;

$.getJSON("/assets/testSuite/testSuite.json",function(testSuiteObject){
    testSuite = testSuiteObject


    var cacheType = getUrlParams("cacheType");
    fillTestSelect(testSuite);
    $("#testAreaOrdered").html(renderTestSuiteStructureMain(testSuiteObject));
    if(cacheType == "browser"){
        console.log("tet");
        convert(testSuiteObject,testSuiteBrowser);
        testCase = new TestCase();

        testCase.load();

        tester = new Tester();
    }
    var number = $("#testSelect").val();
    if(number == "all"){
        $("#testcases").val(getTestCases(testSuite));
    } else if(number) {
        console.log(number)
        $('#testcases').val(findById(number));
    }

    countTestCasesAndRequests();


});


$("#testSelect").change(function(){
    var number = $(this).val();
    if(number == "all"){
        $("#testcases").val(getTestCases(testSuite));
    } else {
        $("#testcases").val(findById(number));
    }

    countTestCasesAndRequests();
});

$("#testcases").on("change",function(e){
    $("#testSelect").val("8.4");
    countTestCasesAndRequests();
});

function fillTestSelect(data) {

    var target = document.getElementById('testSelect');
    target.appendChild(createOption({number : "all", name : "all"}));

    createTestSelection(data, target, 0);

    saveLocal.addElement(target);
};

function getTestCases(topics){
    var testCasesDescription = "";
    for (var i = 0; i < topics.length; i++) {
        if(topics[i]["testCases"]){
            if(topics[i]["testCases"] != ""){

                testCasesDescription +=topics[i]["testCases"];
            }

        } else if(topics[i]["subtopics"]){
            testCasesDescription += getTestCases(topics[i]["subtopics"]);
        }
    }
    return testCasesDescription;
}

function createTestSelection(data, target, level) {
    for(var i = 0; i < data.length; i++) {
        if(data[i].subtopics) {
            var optgroup = createOptgroup(data[i], level);
            target.appendChild(optgroup);
            createTestSelection(data[i].subtopics, target, (level + 1));

        } else if(data[i].testCases !== false) {

            target.appendChild(createOption(data[i], level));
        }
    }
};

function createOptgroup(data, level) {
    var o = document.createElement('option');
    o.setAttribute("style", "padding-left:" + (level * 10) + "px; font-weight: bold;");
    o.value = data.number;
    var name = "";
    for(var i = 0; i < level; i++) {
        name += "  ";
    }

        o.innerHTML = name + data.number + ' ' + data.name

    return o;
};

function createOption(data, level) {
    var o = document.createElement('option');
    o.value = data.number;
    if(data.name == "all"){
        o.innerHTML = "all";
    } else {
        var name = "";
        for(var i = 0; i < level; i++) {
            name += "&nbsp;";
        }
        if(data.testCases != "")
            o.innerHTML = name + data.number + ' ' + data.name + ' (' + countTestCases(data.testCases) + ', ' + countRequests(data.testCases) + ")" ;
        else
            o.innerHTML = name + data.number + ' ' + data.name + ' (' + 0 + ', ' + 0 + ")";
    }

    return o;
};

function findById(number){
    var numberArray = number.split(".");
    var firstLevelNumber = parseInt(numberArray[0]) - 1;

    var level = 0;
    //$("#testcases").val(findTestCases(testSuite[firstLevelNumber],number,level));
    return findTestCases(testSuite[firstLevelNumber],number,level);
}

function findTestCases(topic, number,level){
    var testCases = "";
    if(topic.number == number){
        if(topic.testCases){
            return topic.testCases+"\n";
        } else if(topic.subtopics) {
            testCases+=getTestCases(topic.subtopics);
        }
    } else {

        level++;
        var subNumber = number.split(".")[level]
        testCases+=findTestCases(topic.subtopics[subNumber-1],number,level);
    }

    return testCases;
}

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


function countTestCasesAndRequests(){
    numberOfTestCases = countTestCases($("#testcases").val());
    numberOfRequests = countRequests($("#testcases").val());
    $(".numberOfTestCases").text(numberOfTestCases);
    $(".numberOfRequests").text(numberOfRequests);
    $("#progressTestCases").attr("aria-valuemax",numberOfTestCases);
}

function getUrlParams( prop ) {
    var params = {};
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );

    definitions.forEach( function( val, key ) {
        var parts = val.split( '=', 2 );
        params[ parts[ 0 ] ] = parts[ 1 ];
    } );

    return ( prop && prop in params ) ? params[ prop ] : params;
}

$("#downloadJson").click(function(){
    var dlAnchorElem = this;
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cacheTestObject));
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "cacheTest"+new Date().getTime()+".json");

});



var fr;
$("#load").click(function(){
    var input = document.getElementById("import");
    var file = input.files[0];
    fr = new FileReader();
    fr.onload = renderImportedCacheTest;
    fr.readAsText(file);
});

function checkRequiredInput(){
    $(".is-invalid").remove();
    var isValid = true;
    if($("#server").val() == ""){
        $("#server").addClass("is-invalid");
        $("#server").parent().append(`<div class="invalid-feedback">No target host</div>`);
        //alert("No target host");
        isValid = false;
    } else if(!isUrl($("#server").val())){
        $("#server").addClass("is-invalid")
        $("#server").parent().append(`<div class="invalid-feedback">Please enter a valid URL.</div>`);
        isValid = false;
    }

    if($("#testcases").val() == ""){
        $("#testcases").addClass("is-invalid");
        $("#testcases").parent().append(`<div class="invalid-feedback">No Testcases</div>`);
        isValid = false;
    }

    return isValid;
}

function isUrl(s) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:?+=&%@!\-\/]))?/
    //var regexp = /(http|https):\/\/\w+(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/
    return regexp.test(s);
}
