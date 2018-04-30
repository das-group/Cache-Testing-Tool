$.getJSON("/assets/testSuite/testSuite.json",function(testModel){
	$("#navi").html(renderModelNavi(testModel));
	$("#main").html(renderModelMain(testModel));
	$.getJSON("/assets/cacheTest.json",function(cacheTest){
		var testCases = cacheTest.testCases;
		renderCacheTest(cacheTest);

	});
});

function renderModelNavi(topics){
    var html = "";
    if(topics instanceof Array || topics.length > 0){
    	html += "<ul class='list'>";	
    	for (var i = 0; i < topics.length; i++) {
    		var name = topics[i]["name"];
    		var number = topics[i]["number"];
    		var numberHref = number.split(".").join("_")
    		var hrefCamelCase = camelize(topics[i]["name"]);
    		html += `<li><a href="#${numberHref}">${topics[i]["number"]} ${name}</a>`;
    		if(topics[i]["subtopics"]){
    			html += "<button class='btn btn-light btn-sm collapseList'>&or;</button>";
    			html += renderModelNavi(topics[i]["subtopics"]);
    		}

    		html += "</li>"
    	}

    	html+= "</ul>";
    	return html;
    }
    return "";
}

function renderModelMain(topics) {
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
				html += renderModelMain(topics[i]["subtopics"]) 
			}
			html +="</div>";
			if(layerNumber == 1 && i < (topics.length - 1)){
				html += "<hr/>";
			}
		};
	}

	return html;
	
}

function renderCacheTest(cacheTest){
	var testCases = cacheTest.testCases;
	for (var i = 0; i < testCases.length; i++) {
		var number = testCases[i].number;
		var numberArray = number.split(".");
		numberArray.pop();
		var superNumber = numberArray.join("_");

		var requestResponseDefinitions = testCases[i].requestResponseDefinitions;
		$(`#${superNumber}`).append(`<table id="${testCases[i].timestamp}" class="table table-bordered"><thead></thead><tbody></tbody></table>`);
		$(`#${superNumber} #${testCases[i].timestamp} thead`).append(renderTestCaseNameRow(testCases[i].name));
		for (var j = 0; j < requestResponseDefinitions.length; j++) {
			//requestResponseDefinitions[j];
			$(`#${superNumber} #${testCases[i].timestamp} tbody`).append(renderRequestResponseRow(requestResponseDefinitions[j],testCases[i].name));
		};
	}
}

function camelize(str) {
    return str.replace(/\W+(.)/g, function(match, chr)
    {
        return chr.toUpperCase();
    });
}