/**
 * 
 * @returns {Request}
 */
function Request() {
	
	/**
	 * 
	 * @param {string} url
	 * @param {string} method
	 * @param {Object} requestHeader
	 * @param {Object} responseHeader
	 */
	this.create = function(url, method, requestHeader) {
		var r = new XMLHttpRequest();
		r.open(method.toUpperCase(), url);
		r.addEventListener('readystatechange', this.stateChanged.bind(this, r));


		if(requestHeader !== null) {
			for(var name in requestHeader) {

				r.setRequestHeader(name, requestHeader[name]);

			}
		}

		return r;
	};
	
	/**
	 * 
	 * @param {string} url
	 * @param {Object} requestHeader
	 * @param {Object} responseHeader
	 */
	this.get = function(url, requestHeader) {
		this.r = this.create(url, 'GET', requestHeader);
		this.r.send(null);
	};
	
	this.post = function(url, data, requestHeader) {
		var r = this.create(url, 'POST', requestHeader);
		r.send(data);
	};
	
	this.put = function(url, data, requestHeader) {
		var r = this.create(url, 'PUT', requestHeader);
		r.send(data);
	};

	this.patch = function(url, data, requestHeader) {
		var r = this.create(url, 'PATCH', requestHeader);
		r.send(data);
	};
	
	this.delete = function(url, requestHeader) {
		var r = this.create(url, 'DELETE', requestHeader);
		r.send(null);
	};
	
	/**
	 * Handle state changes
	 * @param {XMLHttpRequest} xhr
	 * @param {Event} e
	 */
	this.stateChanged = function (xhr, e) {
		if(xhr.readyState === 4) {
			// 400er & 500er are in some testcases
			//if(xhr.status >= 200) {
				this.success(xhr);
			//} else {
				//this.error(xhr);
			//}
		}
	};

	/**
	 * to be overwritten
	 * @param {XMLHttpRequest} xhr
	 */
	this.error = function(xhr) {
		log(xhr.status + ': ' + xhr.statusText + '<br>' + xhr.responseURL, "danger");
	};

	// To be overwritten
	this.success = function(xhr) {

	};

	return this;
};