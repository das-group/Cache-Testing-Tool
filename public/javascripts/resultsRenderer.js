function renderTestSuiteStructureMain(topics) {
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
                html += renderTestSuiteStructureMain(topics[i]["subtopics"])
            }
            html +="</div>";
            if(layerNumber == 1 && i < (topics.length - 1)){
                html += "<hr/>";
            }
        };
    }

    return html;

}


function renderTestCase(testCase){

        var number = testCase.number;

        var numberArray = number.split(".");
        var numberUnderscored =  numberArray.join("_");
        numberArray.pop();
        var parentNumber = numberArray.join("_");
        var requestResponseDefinitions = testCase.requestResponseDefinitions;

        if($(`#${numberUnderscored}`).length){
            $(`#${numberUnderscored}`).append(`<table class="table table-bordered ${testCase.timestamp}"><thead></thead><tbody></tbody></table>`);
        } else {
            $(`#${parentNumber}`).append(`<div id="${numberUnderscored}"><table class="table table-bordered ${testCase.timestamp}"><thead></thead><tbody></tbody></table></div>`);
        }

        $(`#${parentNumber} .${testCase.timestamp} thead`).append(renderTestCaseNameRow(testCase.name));
        for (var j = 0; j < requestResponseDefinitions.length; j++) {
            $(`#testAreaOrdered .${testCase.timestamp} tbody`).append(renderRequestResponseRow(requestResponseDefinitions[j],testCase.name));

    }
}


function renderImportedCacheTest(){
    cacheTestObject = JSON.parse(fr.result);
    $("#name").val(cacheTestObject.name);
    $("#server").val(cacheTestObject.server);
    $("#forwardProxy").val(cacheTestObject.forwardProxy);
    $("input[name='tl']").each(function(){
        if(cacheTestObject.tl = $(this).val()){
            $(this).prop("checked",true);
        } else {
            $(this).prop("checked",false);
        }
    });

    for(var key in cacheTestObject.testCases){
        renderTestCase(cacheTestObject.testCases[key]);
    }
}

function camelize(str) {
    return str.replace(/\W+(.)/g, function(match, chr)
    {
        return chr.toUpperCase();
    });
}