// Save & load last values
/*(function(elements) {
	var basename = document.location.pathname.replace(/\//g, "") + '-' + document.title;
	basename = basename.replace(/([^a-z0-9])/ig, "-") + '-';
	for(var i = 0; i < elements.length; i++) {
		if(!elements[i].id) {
			continue;
		}
		try {
			var value = JSON.parse(localStorage.getItem(basename + elements[i].id));
			if(value != "" && value != null) {
				elements[i].value = value;
			}
		} catch (e) { console.error(e); }

		elements[i].addEventListener('keyup', saveLocal.bind(elements[i]));
		elements[i].addEventListener('change', saveLocal.bind(elements[i]));
	}

	function save() {
		try {
			if(this.value == "") {
				localStorage.removeItem(basename + this.id);
			} else {
				localStorage.setItem(basename + this.id, JSON.stringify(this.value));
			}
		} catch(e) { console.error(e); }
	};
})(document.querySelectorAll('input, select'));
*/
function SaveLocal() {

	this.elements = [];
	this.basename = "";

	this.init = function() {
		var basename = document.location.pathname.replace(/\//g, "") + document.title;
		this.basename = basename.replace(/([^a-z0-9])/ig, "-") + '-';

		//document.querySelectorAll('input, select, textarea');
	};

	this.addElements = function(elements) {
		for(var i = 0; i < elements.length; i++) {
			if(!elements[i].id) {
				continue;
			}
			this.addElement(elements[i]);
		}
	};

	this.addElement = function(element) {
		if(!element) {
			return;
		}

		if(!element.eListener) {
			element.eListener = this.save.bind(this, element);
			element.addEventListener('keyup', element.eListener);
			element.addEventListener('change', element.eListener);
		}

		this.load(element);
	};

	this.load = function(element) {
		try {
			var value = JSON.parse(localStorage.getItem(this.basename + element.id));

			if(value != "" && value != null) {
				if(element.type === "checkbox" || element.type === "radio") {
					if(value == element.value) {
						element.checked = true;
					}
				} else {
					element.value = value;
				}
			}
		} catch (e) { console.error(e); }

	};

	this.save = function(element) {
		try {
			var value = element.value;
			if(element.type === "checkbox" || element.type === "radio") {
                //localStorage.removeItem(this.basename + element.name);
				value = element.checked;
			}
			if(value == "") {
				localStorage.removeItem(this.basename + element.id);
			} else {
				localStorage.setItem(this.basename + element.id, JSON.stringify(value));
			}
		} catch(e) { console.error(e); }
	};

	this.init();

	return this;
};

var saveLocal = new SaveLocal();
saveLocal.addElements(document.querySelectorAll('#name, #server, #forwardProxy, #testcases, #testSelect, input[name=tl]'));