/*******************************************************************************
 * Copyright 2015 Hoai Viet Nguyen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package de.thk.das.rest.security.http.rehma.client.request;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;

import org.apache.http.Header;
import org.apache.http.ProtocolVersion;
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase;


public class HttpBasicRequest extends HttpEntityEnclosingRequestBase {
	private String method = "GET";

	@Override
	public String getMethod() {
		return method;
	}
	
	public void setMethod(String method){
		this.method = method; 
	}
	

	public void setProtocolVersion(int major, int minor){
		setProtocolVersion(new ProtocolVersion("HTTP", major, minor));
	}
	
	public void setURI(String uri) throws URISyntaxException{
		setURI(new URI(uri));
	}
	

    public HttpBasicRequest(final URI uri,String method) {
        super();
        setURI(uri);
        setMethod(method);
    }

    /**
     * @throws IllegalArgumentException if the uri is invalid.
     */
    public HttpBasicRequest(final String uri,String method) {
        super();
        setURI(URI.create(uri));
        setMethod(method);
    }
    

    public String getFirstHeaderValue(String name){
    	if(getFirstHeader(name)!=null)
    		return getFirstHeader(name).getValue();
    	else
    		return "";
    }

	public String getBody(){
		StringBuffer result = new StringBuffer();
		String body = "";
		if ( this.getEntity() !=null) {
			try {
				BufferedReader rd = new BufferedReader(new InputStreamReader(
						this.getEntity().getContent()));
				result = new StringBuffer();
				body = "";
				while ((body = rd.readLine()) != null) {
					result.append(body);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}

		}

		return body;
	}
    
    public String toString(){
    	String request = this.getRequestLine().toString()+"\n";
    	for(Header header: this.getAllHeaders()){
    		request+=header+"\n";
    	}
    	
    	StringBuffer result = new StringBuffer();
    	String line = "";
		if ( this.getEntity() !=null) {
			try {
				BufferedReader rd = new BufferedReader(new InputStreamReader(
						this.getEntity().getContent()));
				result = new StringBuffer();
				line = "";
				while ((line = rd.readLine()) != null) {
					result.append(line);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			
		}
    	return request+"\n\n"+result.toString();
    }
    
   
    

}
