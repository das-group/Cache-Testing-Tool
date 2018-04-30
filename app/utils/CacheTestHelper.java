package utils;

import actors.WebSocketActor;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import play.libs.Json;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CacheTestHelper {

	public static HashMap<String, String> getParams(String params){
		
		HashMap<String, String> hm = new HashMap<>();
		String[] paramsArray = params.split(" ");
		for (String param : paramsArray) {
			String[] keyValueArray = param.split(":");
			hm.put(keyValueArray[0], keyValueArray[1]);
		}
		
		return hm;
	}


	public static ObjectNode getParamsNewSyntax(String line){
		ArrayList<String> httpMethods = new ArrayList<>();
		httpMethods.add("GET");
		httpMethods.add("HEAD");
		httpMethods.add("PUT");
		httpMethods.add("POST");
		httpMethods.add("DELETE");
		httpMethods.add("PATCH");
		httpMethods.add("OPTIONS");

		String commands[] = parseTestCaseLine(line);
		ObjectNode paramsObject = Json.newObject();
		ArrayNode expectedValues = Json.newArray();
		ArrayNode expectedValuesShared = Json.newArray();

		if(commands.length < 2){
			return null;
		}

		String method = commands[0];

		if(!httpMethods.contains(method)){
			return null;
		}
		paramsObject.put("method", method);
		paramsObject.put("path",commands[1]);
		paramsObject.put("ts",true);

		for (int i = 2; i < commands.length ; i+=2) {
			if(commands[i].equals("-c")){
				paramsObject.set("requestHeaderFields", parseHeaderFields(commands[i+1]));
			} else if (commands[i].equals("-s")){
				paramsObject.put("responseString",commands[i+1]);
			} else if (commands[i].equals("-p")){
				paramsObject.put("pause" ,parseInt(commands[i+1]));
			} else if (commands[i].equals("-e")){
					JsonNode expectedValueObject = parseExpectedValue(commands[i+1]);
					expectedValues.add(expectedValueObject);
			} else if (commands[i].equals("-e")){
				JsonNode expectedValueObject = parseExpectedValue(commands[i+1]);
				expectedValuesShared.add(expectedValueObject);
			} else if (commands[i].equals("-ts")){
				paramsObject.put("ts",commands[i+1].equals("true"));
			}
		}
		if(expectedValuesShared.size() > 0){
			paramsObject.set("expectedValues",expectedValuesShared);
		} else {
			paramsObject.set("expectedValues",expectedValues);

		}

		return paramsObject;
	}

	public static JsonNode parseHeaderFields(String headerFieldsString){
		ObjectNode headerFieldsObject = Json.newObject();
		String[] headerStringArray = headerFieldsString.split(";");
		for (int i = 0; i < headerStringArray.length; i++) {
			String[] headerFieldArray = headerStringArray[i].split(":");
			if(headerFieldArray.length == 2){
				if(WebSocketActor.cacheHeaderFieldsRequest.containsKey(headerFieldArray[0])){
					headerFieldsObject.put(WebSocketActor.cacheHeaderFieldsRequest.get(headerFieldArray[0]),headerFieldArray[1]);
				} else {
					headerFieldsObject.put(headerFieldArray[0],headerFieldArray[1]);
				}

			}

		}

		return headerFieldsObject;
	}

	public static JsonNode parseExpectedValue(String expectedValueString){
		ObjectNode expectedValueObject = Json.newObject();
		expectedValueObject.put("cacheHitHeader",false);
		expectedValueObject.put("cacheHitBody",false);
		expectedValueObject.put("statusCode",200);
		String[] expectedValueArray = expectedValueString.split(";");
		for (int i = 0; i < expectedValueArray.length; i++) {
			String[] expectedValueKeyValue = expectedValueArray[i].split(":");
			if(expectedValueKeyValue[0].equals("ch")){
				expectedValueObject.put("cacheHitHeader", expectedValueKeyValue[1].equals("true"));
			} else if(expectedValueKeyValue[0].equals("cb")){
				expectedValueObject.put("cacheHitBody", expectedValueKeyValue[1].equals("true"));
			}
			else if(expectedValueKeyValue[0].equals("st")){
				expectedValueObject.put("statusCode", parseInt(expectedValueKeyValue[1]));
			}
		};

		return expectedValueObject;
	}

	public static String getHexString(byte[] b) {
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < b.length; i++){
			sb.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
		}
		return sb.toString();
	}

	public static long getMaxAge(String maxAgeString){

		long maxAge = 0l;
		if(maxAgeString.contains("max-age=")){

			String[] paramsArray = maxAgeString.split(",");
			for (String param : paramsArray) {
				String[] keyValueArray = param.split("=");
				if(keyValueArray[0].equals("max-age")){
					maxAge = Long.parseLong(keyValueArray[1]);


				}

			}
		}


		return maxAge;
	};

	public static long getSMaxAge(String maxAgeString){
		long sMaxAge = 0l;
		if(maxAgeString.contains("s-maxage=")){

			String[] paramsArray = maxAgeString.split(",");
			for (String param : paramsArray) {
				String[] keyValueArray = param.split("=");
				if(keyValueArray[0].equals("s-maxage")){
					sMaxAge = Long.parseLong(keyValueArray[1]);


				}

			}
		}

		return sMaxAge;
	};


	public static String expectedResponseCondition(String expectedValues){
		if(expectedValues.contains("&")){
			return "and";
		} else if (expectedValues.contains("|")){
			return "or";
		} else {
			return "none";
		}
	}

	public static Integer parseInt(String number) {
		try {
			return Integer.parseInt(number);
		} catch (NumberFormatException e) {
			return 0;
		}
	}



	public static String[] parseTestCaseLine(String testCaseLine){
		ArrayList<String> paramsList = new ArrayList<String>();
		Matcher m = Pattern.compile("([^\']\\S*|\'.+?\')\\s*").matcher(testCaseLine);
		while (m.find())
			paramsList.add(m.group(1).replace("\'", ""));
		String[] paramsArray = new String[paramsList.size()];
		for (int i = 0; i < paramsArray.length ; i++) {
			paramsArray[i] = paramsList.get(i);
		}
		return paramsArray;
	}


}
