function TestCase() {

	this.data = [];

	this.currentData = [];
	this.index = [];

	this.current = "";

	this.init = function() {

	};

	this.load = function() {
		var r = new Request();
	
		/**
		 * @param {XMLHttpRequest} xhr
		 */

		var data = testSuiteBrowser;

		data["user-agent"] = navigator.userAgent;
		data.UA = UserAgent.parseUserAgent(navigator.userAgent);

		//var fetching = document.getElementById('fetching');

		//fetching.parentNode.removeChild(fetching);

		this.setData(data);

		//log("User Agent: " + data['user-agent']);

		//log("OS: " + data.UA.os + ', Browser: ' + data.UA.browser + ', Mobile: ' + data.UA.mobile);

		if(document.getElementById('cycle')) {
			document.getElementById('cycle').innerHTML = 'Cycle: ' + data.cycle;
		}

		// index.html
		//fillTestSelect(this.data.collection);


		// Force fresh request

	};


	this.reset = function() {
		this.currentData = JSON.parse(JSON.stringify(this.data));
		this.current = "";
		this.index = [];
		this.indexTests(this.data);
	};

	this.setData = function(data) {
		this.data = data;
		this.reset();
	};


	this.indexTests = function(data) {
		if(data.tests) {
			for(var i = 0; i < data.tests.length; i++) {
				for(var j = 0; j < this.index.length; j++) {
					if(this.index[j] == data.tests[i].id) {
						var list = this.listId(this.index[j]).reverse();
						var msg = "Duplicate Test ID in case " + list.join(", ") + " and a following one.";
						log(msg, "danger");
						throw new Error(msg);

					}
				}
				this.index.push(data.tests[i].id);
			}
			return;
		}
		if(data.collection) {
			for(var i = 0; i < data.collection.length; i++) {
				this.indexTests(data.collection[i]);
			}
		}
	};

	this.listId = function(id, data) {
		var list = [];
		do {
			list.push(id);
			id = this.getParent(id, data).id;
		} while(id != this.getParent(id, data).id);
		return list;
	};

	this.nextTest = function() {

		var next = this.getNextId();
		if(next === false) {
			return false;
		}
		this.current = next;
		return this.getTest(next);
	};

	this.getNextId = function() {
		if(this.current == "") {
			return this.current = this.index[0];
		}
		for(var i = 0; i < this.index.length; i++) {
			if(this.index[i] == this.current) {
				if(i + 1 < this.index.length) {
					return this.index[i + 1];
				}
				break;
			}
		}

		return false;
	};

	this.filter = function(filters) {

		this.currentData.collection = [];
		for(var key in filters) {
			var data = this.findById(filters[key], this.data);
			if(data !== false) {
				this.currentData.collection.push(data);
			}
		}

		this.index = [];
		this.indexTests(this.currentData);
	};

	this.getTest = function(id, data) {
		var test = this.findById(id, data);
		return (test !== false) ? test : false;
	};

	this.findById = function(id, data) {
		if(data === undefined) {
			data = this.currentData;
		}
		if(data.collection) {
			for(var i = 0; i < data.collection.length; i++) {
				if(data.collection[i].id == id) {
					return data.collection[i];
				}
				if(data.collection[i]) {
					var tmp = this.findById(id, data.collection[i]);
					if(tmp !== false) {
						return tmp;
					}
				}
			}
		}
		if(data.tests) {
			for(var i = 0; i < data.tests.length; i++) {
				if(data.tests[i].id == id) {
					return data.tests[i];
				}
			}
		}
		return false;
	};

	this.getParent = function(id, data) {
		var parent = id.replace(/(.*)\.\d+/g, "$1");
		return this.findById(parent, data);
	};

	/**
	 * @param string int
	 * @return obj | null
	 */
	this.getRoot = function(id, data) {
		var ret = null;
		do {
			old_id = id;
			ret = tester.getParent(id, data);
			id = ret.id
		} while(id != old_id);
		return ret;
	};

	this.init();

	return this;
};

