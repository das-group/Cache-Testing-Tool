package utils;

import actors.WebSocketActor;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import play.libs.Json;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Scanner;
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

	public static void buildTestCases() throws IOException {
		File rootFolder = new File("public/testSuite");
		File[] mainTopics = rootFolder.listFiles();
		ArrayNode testModelObject = Json.newArray();
		Arrays.sort(mainTopics, (f1, f2) -> f1.compareTo(f2));
		for (int i = 0; i < mainTopics.length ; i++){

			if (mainTopics[i].isDirectory()) {

				String[] numberAndName = separateNumberAndName(mainTopics[i].getName());
				String topicName = numberAndName[1];
				String fileName = numberAndName[1] + ">";
				String topicNumber = numberAndName[0];
				ObjectNode mainTopicObject = Json.newObject();
				mainTopicObject.put("number",topicNumber);
				mainTopicObject.put("name",topicName);

				mainTopicObject.set("subtopics",listFolders(mainTopics[i],topicName, fileName));
				testModelObject.add(mainTopicObject);


			}
		}

		BufferedWriter out = new BufferedWriter(new FileWriter("public/testSuite/testSuite.json"));
		out.write(testModelObject.toString());
		out.close();
		System.out.println(testModelObject);
	}

	public static JsonNode listFolders(File file, String parentTopicNumber, String fileName) throws IOException {
		String topicNumber = "";
		String topicName = "";
		String currentFileName = fileName;
		ArrayNode subTopics = Json.newArray();
		if(file.isDirectory()){
			File[] subdirectories = file.listFiles();
			Arrays.sort(subdirectories, (f1, f2) -> f1.compareTo(f2));
			for (int i = 0; i < subdirectories.length ; i++) {
				fileName = currentFileName;

				if(subdirectories[i].isDirectory()){
					String[] numberAndName = separateNumberAndName(subdirectories[i].getName());
					topicName = numberAndName[1];
					fileName += topicName+">";
					topicNumber = numberAndName[0];
					ObjectNode subTopicObject = Json.newObject();
					subTopicObject.put("name",topicName);
					subTopicObject.put("number",topicNumber);

					JsonNode object = listFolders(subdirectories[i],topicNumber, fileName);
					if(object.isArray()){
						subTopicObject.set("subtopics",object);
						subTopics.add(subTopicObject);
					} else if(object.isObject()){
						subTopicObject.set("testCases",object.get("testCases"));
						subTopicObject.set("references",object.get("references"));
						subTopics.add(subTopicObject);
					}

				} else if(subdirectories[i].getName().equals("testCases.ct")){
					ObjectNode testCaseObject = Json.newObject();

					testCaseObject.put("testCases",renumberTestCases(subdirectories[i], parentTopicNumber, fileName));
					String absolutePath = subdirectories[i].getAbsolutePath();
					String name = subdirectories[i].getName();

					String referencesPath = absolutePath.replaceAll(name,"references.json");
					System.out.println(referencesPath);
					File referenceFile = new File(referencesPath);
					if(referenceFile.exists()){
						String referenceString = new String(Files.readAllBytes(referenceFile.toPath()));
						testCaseObject.set("references",Json.parse(referenceString));
					}

					return testCaseObject;
				}
			}
		}

		return subTopics;
	}

	public static String[] separateNumberAndName(String foldername){
		String[] numberAndName = new String[2];
		numberAndName[1] = "";
		String[] foldernameArray = foldername.split("_");
		numberAndName[0] = foldernameArray[0];
		for (int i = 1; i < foldernameArray.length ; i++){
			if(i < (foldernameArray.length - 1) )
				numberAndName[1] += foldernameArray[i] + " ";
			else
				numberAndName[1] += foldernameArray[i];

		}

		return numberAndName;
	}

	public static String renumberTestCases(File file, String topicNumber, String fileName) throws IOException {
		String testCaseFile = new String(Files.readAllBytes(file.toPath()));
		String testCaseFileNewStucture = "";
		Scanner scanner = new Scanner(testCaseFile);
		if(scanner.hasNext()){

			testCaseFileNewStucture = "# "+fileName + "\n";

			int counter = 1;
			int emptyLineCounter = 0;
			while (scanner.hasNextLine()) {
				String line = scanner.nextLine();

				if (!line.isEmpty() && line.charAt(0) == '#') {

					if(line.startsWith("###")){
						continue;
					}

					if(line.startsWith("##")){
						testCaseFileNewStucture += "\n";
						String[] lineArray = line.split(" ");
						String hashTag = lineArray[0];
						String testCaseName = "";
						if(Character.isDigit(line.charAt(0))){

						}
						for (int i = Character.isDigit(line.charAt(3)) ? 2 : 1; i < lineArray.length ; i++) {
							if(i < (lineArray.length - 1))
								testCaseName +=lineArray[i] + " ";
							else
								testCaseName +=lineArray[i];
						}

						String testCaseStartLine = "##"+" "+topicNumber+"."+ counter++ + " " + testCaseName;
						testCaseFileNewStucture+=testCaseStartLine + "\n";
					}
				} else if(line.isEmpty()){
//                    emptyLineCounter++;
//                    if(emptyLineCounter > 1){
//                        emptyLineCounter = 0;
//                        continue;
//                    }
//                    testCaseFileNewStucture += "\n";
					continue;
				} else if(checkTestCaseLinePattern(line)) {
					testCaseFileNewStucture += line + "\n";
				}
			}
			testCaseFileNewStucture+="\n" + "# "+fileName;

		}

		BufferedWriter out = new BufferedWriter(new FileWriter(file.getParentFile()+"/testCases.ct"));
		out.write(testCaseFileNewStucture);
		out.close();

		return testCaseFileNewStucture;
		//System.out.println(testCaseFileNewStucture);
	}

	public static boolean checkTestCaseLinePattern(String line){
		ArrayList<String> httpMethods = new ArrayList<>();
		httpMethods.add("GET");
		httpMethods.add("HEAD");
		httpMethods.add("PUT");
		httpMethods.add("POST");
		httpMethods.add("DELETE");
		httpMethods.add("PATCH");
		httpMethods.add("OPTIONS");

		String[] lineArray = line.split(" ");
		if(httpMethods.contains(lineArray[0])){
			return true;
		}

		return false;
	}


}
