/* global result */

function Tester() {
	this.request = new Request();

	this.step = 0;
	this.urlPath = "";
	this.host = document.getElementById("server").value;
	this.urlParams = "";
	this.stop = false;

	this.case = null;
	this.incognito = 0;
	this.shared = 0;

	this.btnStart = document.getElementById('start');
	this.btnStop = document.getElementById('stop');

	this.init = function() {
		this.btnStart.addEventListener('click', this.startButton.bind(this));
		this.btnStop.addEventListener('click', this.stopButton.bind(this));
	};

	this.execute = function() {



		if(this.case.steps.length <= this.step) {
			this.finished();
			return;
		}


		var step = this.case.steps[this.step];
		var params = step.params ? step.params : {};

		/**
		 * @param {xhr} XMLHttpRequest
		 */
		this.request.success = function(xhr) {
			try {
				result.add(this.case, this.step, xhr);
				console.log("success");
				this.step++;
				if(this.stop) {
					return;
				}
				var delay = 1;
				// If delay, wait the time
				if(typeof(params.p) !== "undefined" && params.p > 0) {
					log("Waiting for: " + params.p + ' seconds', "gray");
					delay = params.p > 0 ? params.p : 0;
				}

                $(".requestCounter").text(++requestCounter);
                $("#progressRequests").attr("aria-valuenow",requestCounter);
                var progressRequests = (requestCounter/numberOfRequests) * 100
                $("#progressRequests").css("width",`${progressRequests}%`);
                $("#progressRequests").text(progressRequests.toFixed(2) + "%");

				setTimeout(this.execute.bind(this), delay * 1000);

			} catch(e) {
                console.log("error");
				console.error(e);
			}
		}.bind(this);

		var requestHeader = (typeof(params.c) !== "undefined") ? parseHeader(params.c) : {};
		requestHeader['id'] = +new Date();

		var url = this.host + step.url + this.urlParams;

		step.requestBody = "";
		step.requestHeaderFields = {};


        step.requestHeaderFields["X-Response"] =  (typeof(params.s) !== "undefined") ? params.s : "";

        if(requestHeader !== null) {
            for(var name in requestHeader) {
                if(typeof(headerFields[name]) === "undefined") {

                    step.requestHeaderFields[name] = requestHeader[name];
                } else {
                    step.requestHeaderFields[headerFields[name]] = requestHeader[name];
				}


            }
        }

		switch(step.method) {
			case 'PUT':
				this.request.put(url, step.requestBody,  step.requestHeaderFields);
				break;
			case 'DELETE':
				this.request.delete(url,  step.requestHeaderFields);
				break;
			case 'POST':
				this.request.post(url, step.requestBody,  step.requestHeaderFields);
				break;
			case 'PATCH':
				this.request.patch(url, step.requestBody,  step.requestHeaderFields);
				break;
			default:
				this.request.get(url,  step.requestHeaderFields);
				break;
		}
	};

	this.convertHeader = function(headers) {
		if(object.keys(headers).length === 0) {
			return {};
		}
		for(var name in headers) {
			var header = header[key];
		}
	};


	/**
	 * Test finish - start next test
	 */
	this.finished = function() {
		// log("Finished Test " + this.case.id, "gray");
		// log("###", "gray");

		result.reset();

		this.case.incognito = this.incognito;
		this.case.cycle = testCase.data.cycle;
		
		// Send testresponse to Servercallback
		result.sendData(this.case, function() {

			// load next test
			setTimeout(this.start.bind(this), 100);
		}.bind(this));
	};

	/**
	 * Start current test
	 */
	this.start = function() {

		if(this.stop) {
			return;
		}
		this.changeTest();

		if(this.case === null) {
			// log("There is no (next) test case", "red");
			// this.btnStop.style.display = 'none';
            this.btnStart.classList.remove("disabled");
            this.btnStop.classList.add("disabled");
            $('#testCasesFinishedModal').modal('show');
			return;
		}

        testCaseCounter++;
        console.log(testCaseCounter);
        $(".testCaseCounter").text(testCaseCounter)
        $("#progressTestCases").attr("aria-valuenow",testCaseCounter);
        var progressTestCases = (testCaseCounter/numberOfTestCases) * 100
        $("#progressTestCases").css("width",`${progressTestCases}%`);
        $("#progressTestCases").text(progressTestCases.toFixed(2) + "%");


		this.execute();
	};

	this.startButton = function() {

		//this.getFilteredTests();

		if(!checkRequiredInput()){
			return;
		}

        numberOfErrors = 0;

        cacheTestObject.name = $("#name").val();
        cacheTestObject.server = $("#server").val();
        cacheTestObject.forwardProxy = $("#forwardProxy");
        cacheTestObject.testCases = testCasesObject;

        //Reset progress bar
        $(".requestCounter").text(0);
        requestCounter = 0;
        $("#progressRequests").attr("aria-valuenow",0);
        $("#progressRequests").css("width","0%");
        $("#progressRequests").text(0 + "%");

        $(".testCaseCounter").text(0);
        $("#progressTestCases").attr("aria-valuenow",0);
        $("#progressTestCases").css("width","0%");
        $("#progressTestCases").text(0 + "%");

        $('#testArea').html("");
        $('#nonComplianceList').html("");
        testCaseCounter = 0;

		this.stop = false;
		this.host = document.getElementById("server").value;
		this.incognito = document.getElementById('incognito').checked ? true : false;
		// this.shared = document.getElementById('shared').checked ? true : false;

		this.btnStop.classList.remove("disabled")
		this.btnStart.classList.add("disabled")

        var tests = parse(document.getElementById("testcases").value);

		var data = {};
        data.tests = tests;

        data["user-agent"] = navigator.userAgent;
        data.UA = UserAgent.parseUserAgent(navigator.userAgent);

        testCase.setData(data);

		this.start();
	};

	this.stopTest = function() {
		this.stop = true;

        this.btnStop.classList.add("disabled")
        this.btnStart.classList.remove("disabled")
	};

	this.stopButton = function() {
		log("Stopping current test..", "danger");
		this.stopTest();
	};

	/**
	 * 
	 */
	this.changeTest = function() {
		this.step = 0;
		this.urlPath = "";
		this.urlParams = "";
		this.case = null;

		var next = testCase.nextTest();
		if(next === false) {
			return;
		}
		this.case = next;
		this.case.timestamp = new Date().getTime();
	
		// Generate for each test a unique URL
		if($("input[name='tl']:checked").val() == "query"){
            this.urlParams = '?ts=' +this.case.timestamp;
		} else if($("input[name='tl']:checked").val() == "path"){
            this.urlParams = '/' +this.case.timestamp;
		}

		// Check "Set-Cookie" and set a custom path. The Cookie is only valid for the specific path
		// for(var i = 0; i < this.case.steps.length; i++) {
		// 	if(this.case.steps[i].params.s && this.case.steps[i].params.s.indexOf("sc:") !== -1) {
		// 		this.urlPath = this.case.id.replace(/\./g, "-");
		// 		break;
		// 	}
		// }

		// Skip test for shared Caches
		// if(this.case !== null) {
		// 	// if(this.case.sharedCache && !this.shared) {
		// 	// 	log("Skipping test " + this.case.id + " because it's only for shared caches", "info");
		// 	// 	this.changeTest();
		// 	// 	return;
		// 	// }
		// 	if(this.case.hasTerminate) {
		// 		log("Skipping test " + this.case.id + " because it's require to shut down the server", "info");
		// 		this.changeTest();
		// 		return;
		// 	}
		// }


	};

	this.getFilteredTests = function() {
		var selectedCase = document.getElementById('testSelect').value;
		if(selectedCase == "") {
			testCase.reset();
		} else {
			testCase.filter([selectedCase]);
		}
	};

	this.init();

	return this;
};



