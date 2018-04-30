var counter = 0;
var numberOfErrors = 0;

function renderRequestResponseRow(requestResponseDefinitionObject, testCaseName){
    counter++;
    var method = requestResponseDefinitionObject.request.requestLine.method;
    var statusCode = requestResponseDefinitionObject.response.statusLine.statusCode;
    var url = requestResponseDefinitionObject.request.requestLine.url;
    var cacheHitHeader = requestResponseDefinitionObject.cacheHitHeader;
    var cacheHitBody = requestResponseDefinitionObject.cacheHitBody;
    var cacheHitType = requestResponseDefinitionObject.cacheHitType;
    var stale = requestResponseDefinitionObject.response.stale;
    var testCaseRequestNumber = requestResponseDefinitionObject.request.testCaseRequestNumber;
    var compliance = requestResponseDefinitionObject.response.compliance != null ? requestResponseDefinitionObject.response.compliance.compliance : null;
    var complianceErrors = requestResponseDefinitionObject.response.compliance != null ? requestResponseDefinitionObject.response.compliance.errors : [];
    var responseTimeOfDateHeaderField = moment(requestResponseDefinitionObject.response.responseTimeOfDateHeaderField).utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]');
    var responseTimeReceived = moment(requestResponseDefinitionObject.response.responseTimeReceived).utc().format('DD.MM.YYYY HH:mm:ss');
    var expirationTime = moment(requestResponseDefinitionObject.response.expirationTime).utc().format('DD.MM.YYYY HH:mm:ss');
    var pause = requestResponseDefinitionObject.pause;
    var protocolRequest = requestResponseDefinitionObject.request.requestLine.protocol;
    var protocolResponse = requestResponseDefinitionObject.response.statusLine.protocol;
    var versionRequest = requestResponseDefinitionObject.request.requestLine.major + "." + requestResponseDefinitionObject.request.requestLine.minor;
    var versionResponse = requestResponseDefinitionObject.response.statusLine.major + "." + requestResponseDefinitionObject.response.statusLine.minor;
    var reasonPhrase = requestResponseDefinitionObject.response.statusLine.reasonPhrase;
    var requestBody = requestResponseDefinitionObject.request.body;
    var responseBody = requestResponseDefinitionObject.response.body;

    var requestHeaderFields = requestResponseDefinitionObject.request.headerFields;
    var responseHeaderFields = requestResponseDefinitionObject.response.headerFields;

    var requestHeaderFieldsString = "<div class='collapse'>";

    var responseHeaderFieldsString = "<div class='collapse'>";

    var responseId = "";
    var requestId = "";

    for(var headerFieldName in responseHeaderFields){
        if(headerFieldName == "X-Id" || headerFieldName == "x-id" || headerFieldName == "Id" || headerFieldName == "id"){
            responseId = responseHeaderFields[headerFieldName].trim();
            responseHeaderFieldsString += `<span class="${responseHeaderFields[headerFieldName]}"><strong>${headerFieldName}</strong>` + ": "+responseHeaderFields[headerFieldName] + "</span><br/>";
        } else {
            responseHeaderFieldsString += `<strong>${headerFieldName}</strong>` + ": "+responseHeaderFields[headerFieldName] + "<br/>";
        }

    }

    if (responseBody != ""){
        responseBody = htmlchars(responseBody);
        responseBodyId = isJson(responseBody) ? JSON.parse(responseBody).Id : "";
        responseHeaderFieldsString+=`<br/><span class="responseBody" bid="${responseBodyId}">${responseBody}</span>`;
    }

    for(var headerFieldName in requestHeaderFields){
        if(headerFieldName == "X-Id"){
            requestId = requestHeaderFields[headerFieldName];
            requestHeaderFieldsString += `<span class="${requestHeaderFields[headerFieldName]}"><strong>${headerFieldName}</strong>` + ": "+requestHeaderFields[headerFieldName] + "</span><br/>";
        } else {
            requestHeaderFieldsString += `<strong>${headerFieldName}</strong>` + ": "+requestHeaderFields[headerFieldName] + "<br/>";
        }


    }

    if (requestBody != ""){
        requestBody = htmlchars(requestBody);
        requestHeaderFieldsString+=`<br/> ${requestBody}`;
    }

    requestHeaderFieldsString += "</div>";
    responseHeaderFieldsString += "</div>";
    var row =  `<tr id="request${counter}">`;
    row +=       `<td class="${requestId} message request" rid="${requestId}"><span class="startLine" rid="${requestId}"><span class="method">${method}</span> <span class="url">${url}</span> <span class="protocol">${protocolRequest}/${versionRequest}</span></span> <span class="oi oi-caret-bottom toggleCollapse"></span> ${requestHeaderFieldsString}</td>`;
    row +=       `<td class="${responseId} message response" rid="${responseId}"><span class="startLine" rid="${responseId}"><span class="statusCode">${statusCode} ${reasonPhrase}</span> <span class="protocol">${protocolResponse}/${versionResponse}</span></span> <span class="oi oi-caret-bottom toggleCollapse"></span> ${responseHeaderFieldsString}</td>`;
    if(cacheHitHeader || cacheHitBody){
        row +=       `<td><span class="oi oi-circle-check" aria-hidden="true" style="color:green"></span> <strong>${cacheHitType}</strong></td>`;
    } else {
        row +=       `<td><span class="oi oi-circle-x" aria-hidden="true" style="color:red"></span></td>`;
    }

    if(compliance){
        row +=       `<td><span class="oi oi-circle-check" aria-hidden="true" style="color:green"></span></td>`;
    } else if(compliance == false) {
        $("#numberOfErrors").text(++numberOfErrors);
        $("ul#nonComplianceList").append(`<li><a href="#request${counter}">${testCaseName}, #${testCaseRequestNumber}</a></li>`)
        var errorDesc = "";
        for (var i = 0 ; i < complianceErrors.length ; i++) {
            errorDesc += `<span class="badge badge-warning">${complianceErrors[i]}</span><br/>`;
        }
        row += `<td><span class="oi oi-circle-x" aria-hidden="true" style="color:red"></span><br/>${errorDesc}</td>`;
    } else if(compliance == null){
        row +=       `<td> N/A </td>`;
    }


    // if(stale == true){
    //
    //     row +=       `<td class="danger">stale<br/>ResponseTime: <strong>${responseTimeReceived}</strong><br/>ExpirationTime: <strong>${expirationTime}</strong></td>`;
    // } else if (stale == false) {
    //     row +=       `<td class="success">fresh<br/>ResponseTime: <strong>${responseTimeReceived}</strong><br/>ExpirationTime: <strong>${expirationTime}</strong></td>`;
    // } else if (stale == null){
    //     row +=       `<td>N/A</td>`;
    // }

    row +=     "</tr>";
    row +=`<tr class="table-info"><td colspan="5">${pause} second(s) later</td></tr>`;
    return row;
}

function renderTestCaseNameRow(name){

    //var row = `<tr class="active testCaseName"><th>${name}</th><th>Response</th><th>Cache hit</th><th>Compliant</th><th>Stale</th></tr>`;
    var row = `<tr class="table-active testCaseName"><th>${name}</th><th>Response</th><th>Cache hit</th><th>Compliant</th></tr>`;
    return row;
}

function htmlchars(str){

    return str.replace(/[&<>]/g, replaceTag);

}

function replaceTag(tag) {
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return tagsToReplace[tag] || tag;
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

$("body").on("click",".toggleCollapse",function(){

    $(this).parent().parent().find(".collapse").collapse('toggle');

    var td = $(this).parent();
    var tr = td.parent();

    if(td.hasClass("request")){
        var glyphicon = tr.find(".response").find(".glyphicon");

        if($(glyphicon).hasClass("glyphicon-collapse-down")){
            $(glyphicon).removeClass("glyphicon-collapse-down");
            $(glyphicon).addClass("glyphicon-collapse-up");
        } else {
            $(glyphicon).removeClass("glyphicon-collapse-up");
            $(glyphicon).addClass("glyphicon-collapse-down");
        }

    } else if(td.hasClass("response")){
        var glyphicon = tr.find(".request").find("i.glyphicon");
        if($(glyphicon).hasClass("glyphicon-collapse-down")){
            $(glyphicon).removeClass("glyphicon-collapse-down");
            $(glyphicon).addClass("glyphicon-collapse-up");
        } else {
            $(glyphicon).removeClass("glyphicon-collapse-up");
            $(glyphicon).addClass("glyphicon-collapse-down");
        }
    }

    if($(this).hasClass("glyphicon-collapse-down")){
        $(this).removeClass("glyphicon-collapse-down");
        $(this).addClass("glyphicon-collapse-up");
    } else {
        $(this).removeClass("glyphicon-collapse-up");
        $(this).addClass("glyphicon-collapse-down");
    }
})


$("body").on("click",".startLine",function(){
    var requestHeaderId = $(this).attr("rid");
    var responseBodyId = $(this).parent().find("span.responseBody").attr("bid");
    var tbody = $(this).parent().parent().parent();

    var message = $(this).parent();


    var messages = tbody.find(".message");
    messages.removeClass("table-danger");
    messages.removeClass("table-success");
    messages.each(function(index,element){
        var requestHeaderIdOfElement = $(element).attr("rid");
        if($(element).hasClass("response")){
            var responseBodyIdOfElement = $(element).find("span.responseBody").first().attr("bid");
            if(responseBodyIdOfElement == requestHeaderId ){
                $(element).addClass("table-danger");
            }
        }


       if(requestHeaderIdOfElement == requestHeaderId){
           $(element).removeClass("table-danger");
           $(element).addClass("table-success");
       } else if(requestHeaderIdOfElement == responseBodyId){
           $(element).addClass("table-danger");
       }
    });


})