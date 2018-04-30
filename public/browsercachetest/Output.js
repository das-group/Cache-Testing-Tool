function Output(target) {
	
	this.stack = [];
	this.index = 0;
	this.target = target;

	this.add = function(data) {
		for(var i = 0; i < this.stack.length; i++) {
			if(JSON.stringify(this.stack[i]) === JSON.stringify(data)) {
				return this;
			}
		}
		this.stack.push(data);
		return this;
	};

	this.renderTest = function(test) {
		var testElement = this.newTest(test);

		for(var i = 0; i < test.steps.length; i++) {
			if(typeof(test.steps[i].validated) === "undefined") {
				continue;
			}
			this.showStep(testElement, test, i);	
		}

		return this;
	};

	this.newTest = function(test) {
		var testElement = document.getElementById('test-' + test.id);
		if(!testElement) {
			testElement = document.createElement('div');
			testElement.className = "testContainer";
			testElement.id = 'test-' + test.id;

			var div = document.createElement('div');
			div.innerHTML = test.name;
			div.className = "title";
			testElement.appendChild(div);

			this.target .insertAdjacentElement('afterbegin', testElement);
		}
		return testElement;
	}

	this.showStep = function(target, test, step_count) {
		var id = 'step-' + step_count;
		var table = target.querySelector('#' + id);
		if(table) {
			return;
		}

		var step = test.steps[step_count];

		var table = document.createElement('div');
		table.className = "step";
		table.id = id;
	
		var div = document.createElement('div');
		div.className = "status";

		var span = document.createElement('span');
		span.className = "stepName";
		span.innerHTML = '#' + step_count;
		div.appendChild(span);

		this.createValidation(div, step.validated);

		table.appendChild(div);


		var header = document.createElement('div');
		header.className = "row";

		var request = document.createElement('div');
		request.className = "column";
		request.innerHTML = '<h4>Request</h4>';

		if(step.requestHeader) {
			this.createRow(request, step.requestHeader);
		}

		header.appendChild(request);

		var responded = document.createElement('div');
		responded.className = "column";
		responded.innerHTML = '<h4>Responded</h4>';

		if(step.respondedHeader) {
			this.createRow(responded, step.respondedHeader);
		}

		header.appendChild(responded);

		var missing = document.createElement('div');
		missing.className = "column";
		missing.innerHTML = '<h4>Missing</h4>';

		if(step.missingHeaders) {
			this.createRow(missing, step.missingHeaders);
		}

		header.appendChild(missing);

		table.appendChild(header);


		table.addEventListener('click', function(test) {
			var el = document.querySelector('.console .t-' + test.id.replace(/\./g, "-"));
			el.scrollIntoView(true);
		}.bind(this, test));

		target.appendChild(table);
	
	};

	this.createRow = function(target, object) {
		var table = document.createElement('table');
		for(var key in object) {
			
			var row = document.createElement('tr');

			var col = document.createElement('td');
			col.innerHTML = key;
			row.appendChild(col);

			var col = document.createElement('td');
			col.className = "mono";
			col.innerHTML = object[key];
			row.appendChild(col);

			table.appendChild(row);
		}
		target.appendChild(table);
	};

	this.createValidation = function(target, validation) {
		var table = document.createElement('table');
		table.className = "validation";

		for(var key in validation) {
			if(key == "ok") {
				continue;
			}
			var tr = document.createElement('tr');
			if(validation[key].ok === true) {
				tr.className = "success";
			} else if(validation[key].ok === false) {
				tr.className = "danger";
			}
			
			var td = document.createElement('td');
			td.innerHTML = key;
			tr.appendChild(td);

			var td = document.createElement('td');
			td.title = "Received / Expected"
			td.innerHTML = validation[key].received + '/' + validation[key].expection;
			tr.appendChild(td);


			var td = document.createElement('td');
			td.className = "mono";
			if(validation[key].message) {
				td.innerHTML = (validation[key].message.length > 80) ? validation[key].message.substr(0, 80) + "..." : validation[key].message;
			}
			tr.appendChild(td);


			table.appendChild(tr);
		}
		target.appendChild(table);
	};

	return this;
};

var output = new Output(document.getElementById('output'));