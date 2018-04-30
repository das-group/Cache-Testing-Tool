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

import org.apache.http.ProtocolVersion;
import org.apache.http.message.BasicHttpResponse;

public class HttpBasicResponse extends BasicHttpResponse{
	private String reason;
	private int statusCode;
	
	public String getFirstHeaderValue(String name){
    	if(getFirstHeader(name)!=null)
    		return getFirstHeader(name).getValue();
    	else
    		return "";
    }
	
	public HttpBasicResponse(int statusCode, String reason){
		super(new ProtocolVersion("HTTP", 1, 1),statusCode,reason);
		this.reason = reason;
		this.statusCode = statusCode;
	}
	
	public void setProtocolVersion(int major, int minor){
		setStatusLine(new ProtocolVersion("HTTP", major, minor), this.statusCode);
	}
	
}
