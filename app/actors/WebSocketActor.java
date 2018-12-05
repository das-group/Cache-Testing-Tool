package actors;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import akka.actor.PoisonPill;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sun.org.apache.xerces.internal.impl.xs.opti.DefaultDocument;
import org.apache.http.conn.HttpHostConnectException;
import org.apache.http.entity.StringEntity;
import org.xml.sax.InputSource;
import org.apache.http.*;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.HttpCoreContext;

import com.fasterxml.jackson.databind.JsonNode;

import akka.actor.ActorRef;
import akka.actor.Props;
import akka.actor.UntypedAbstractActor;
import de.thk.das.rest.security.http.rehma.client.request.HttpBasicRequest;
import org.w3c.dom.Document;
import play.libs.Json;
import utils.CacheTestHelper;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

public class WebSocketActor extends UntypedAbstractActor {

	public static HashMap<String,String> cacheHeaderFieldsRequest;
	private HttpClient client;

	public static Props props(ActorRef out) {

		return Props.create(WebSocketActor.class, out);
	}

	private final ActorRef out;


	public WebSocketActor(ActorRef out) {
		client = HttpClients.custom().build();
		this.out = out;

		cacheHeaderFieldsRequest = new HashMap<>();
		cacheHeaderFieldsRequest.put("cc", "Cache-Control");
		cacheHeaderFieldsRequest.put("ac", "Accept");
		cacheHeaderFieldsRequest.put("al", "Accept-Language");
		cacheHeaderFieldsRequest.put("ims", "If-Modified-Since");
		cacheHeaderFieldsRequest.put("ius", "If-Unmodified-Since");
		cacheHeaderFieldsRequest.put("im", "If-Match");
		cacheHeaderFieldsRequest.put("inm", "If-None-Match");
		cacheHeaderFieldsRequest.put("pr", "Pragma");
		cacheHeaderFieldsRequest.put("az", "Authorization");
		cacheHeaderFieldsRequest.put("ir", "If-Range");
		cacheHeaderFieldsRequest.put("ra", "Range");
		cacheHeaderFieldsRequest.put("va", "Vary");
		cacheHeaderFieldsRequest.put("cl","Content-Length");
	}


	public void onReceive(Object message) throws IOException {

		boolean stop = false;

		if (message instanceof String) {
			if(((String) message).isEmpty()){
				self().tell(PoisonPill.getInstance(), self());
			}
			if(message.toString().equals("stop")){
				stop = true;
			}
			ArrayList<String> requestIds = new ArrayList<String>();
			JsonNode json = Json.parse(message.toString());

			ObjectNode testCase, requestObject, requestLineObject, responseObject, statusLineObject;
			ObjectNode responseHeaderFieldsObject;
			ObjectMapper objectMapper = new ObjectMapper();

			String server = json.get("server").asText();
			String forwardProxy = json.has("forwardProxy")  ?  json.get("forwardProxy").asText() : "";


			String testCases = json.get("testCases").asText();
			String tl = json.get("tl").asText();
			Scanner scanner = new Scanner(testCases);

			Long timeStamp = 0l;

			long expirationTimeStartResponse = -1;

			int testCaseRequestNumber = 1;

			HttpBasicRequest request = null;
			String lastModified = "";
			URI forwardProxyUri = null;
			HttpHost httpProxy = null;

			//Create HTTP client
			if(!forwardProxy.isEmpty()){
				try {
					forwardProxyUri = new URI(forwardProxy);
					httpProxy = new HttpHost(forwardProxyUri.getHost(),forwardProxyUri.getPort(),forwardProxyUri.getScheme());

				} catch (URISyntaxException e) {
					self().tell("Invalid Forward proxy URL", self());
				}

			} else {
				client = http.HttpClientBuilder.create().build();
			}

			// Read test case lines
			while (scanner.hasNextLine()) {
				if(stop){
					self().tell(PoisonPill.getInstance(), self());
					break;
				}
				testCase = Json.newObject();
				String line = scanner.nextLine();

				if (!line.isEmpty() && line.charAt(0) == '#') {

					if(line.startsWith("###")){
						continue;
					}
					if(line.startsWith("##")){
						timeStamp = new Date().getTime();
						testCaseRequestNumber = 1;
						String[] lineArray = line.split(" ");
						testCase.put("timestamp",timeStamp.toString());
						testCase.put("number",lineArray[1]);
						testCase.put("name", line.replaceAll("##",""));
						out.tell(testCase.toString(), self());
					}

				} else if (line.isEmpty()) {

					continue;
				} else {

					ObjectNode requestResponseDefinitionObject = Json.newObject();

					JsonNode paramsObject = CacheTestHelper.getParamsNewSyntax(line);

					if(paramsObject == null){
						continue;
					}

					String method = paramsObject.get("method").asText();
					String urlPath = paramsObject.get("path").asText();

					ObjectNode requestHeaderFieldsObject = paramsObject.has("requestHeaderFields") ? (ObjectNode) objectMapper.readTree(paramsObject.get("requestHeaderFields").toString()) : Json.newObject();
					String responseString = paramsObject.has("responseString") ? paramsObject.get("responseString").asText() : "";

					boolean noTimestamp = !paramsObject.get("ts").asBoolean();

					URI uri = null;
					if(noTimestamp || tl.equals("none")){
						try {
							uri = new URIBuilder(server+urlPath).build();
						} catch (URISyntaxException e) {
							e.printStackTrace();
						}
					} else {
						try {
							if(tl.equals("path")){
								uri = new URIBuilder(server+urlPath+"/"+timeStamp.toString()).build();
							} else {
								uri = new URIBuilder(server+urlPath).addParameter("ts", timeStamp.toString()).build();
							}
						} catch (URISyntaxException e) {
							e.printStackTrace();
						}
					}


					request = new HttpBasicRequest(uri, method);

					// Generate request id
					SecureRandom random = new SecureRandom();
					byte bytes[] = new byte[8];
					random.nextBytes(bytes);
					String requestId = CacheTestHelper.getHexString(bytes);

					SimpleDateFormat format = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
					SimpleDateFormat formatGMT = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
					formatGMT.setTimeZone(TimeZone.getTimeZone("GMT"));

					request.setHeader("X-Id", requestId);
					request.setHeader("Id",requestId);
					request.setHeader("Connection","close");
					request.setHeader("X-Response", responseString);
					request.setHeader("X-Request-Date", formatGMT.format(new Date()));

					// This header is required Apache TS
					request.setHeader("X-Debug","X-Cache-Key, X-Cache, X-Cache-Generation, X-Milestones, X-Transaction-ID, Diags, Via");

					for (Iterator<String> iterator = requestHeaderFieldsObject.fieldNames(); iterator.hasNext();) {
						String requestHeaderFieldName = iterator.next();
						String requestHeaderFieldValue = requestHeaderFieldsObject.get(requestHeaderFieldName).asText();
						if(requestHeaderFieldName.equals("If-Modified-Since")){
							long lastModifiedPlusDelta = 0;
							try {
								lastModifiedPlusDelta = format.parse(lastModified).getTime() + CacheTestHelper.parseInt(requestHeaderFieldValue) * 1000;
							} catch (ParseException e) {
								e.printStackTrace();
							}
							request.setHeader(requestHeaderFieldName, formatGMT.format(lastModifiedPlusDelta));
						}  else if (requestHeaderFieldName.equals("Accept")){
							request.addHeader("Accept",requestHeaderFieldValue);
							request.addHeader("X-Accept",requestHeaderFieldValue);
						} else if (requestHeaderFieldName.equals("rs") && requestHeaderFieldValue.equals("1")) {
							request.addHeader("X-Response-Splitting","%0d%0a%0a%3Chtml%3E%3Cbody%3Efirst body%3C/body%3E%3C/html%3E%0d%0a%0d%0aHTTP/1.1 200 OK%0d%0aContent-Type: text/html%0d%0a%0d%0a%3Chtml%3E%3Cbody%3Epoisioned body%3C/body%3E%3C/html%3E");
						} else if (requestHeaderFieldName.equals("reqsmug") && requestHeaderFieldValue.equals("1")){
							request.addHeader("Content-Length","45");
							request.setEntity(new StringEntity("GET /~attacker/foo.html HTTP/1.1\n" +
									"Something: GET http://www.target.site/~victim/bar.html HTTP/1.1\n" +
									"Host: www.target.site\n" +
									"Connection: Keep-Alive"));

						} else if (requestHeaderFieldName.equals("reqsmug") && requestHeaderFieldValue.equals("2")) {
							request.addHeader("Content-Length", "0");
							request.setEntity(new StringEntity("GET /~attacker/foo.html HTTP/1.1\n" +
									"Something: GET http://www.target.site/~victim/bar.html HTTP/1.1\n" +
									"Host: www.target.site\n" +
									"Connection: Keep-Alive"));
						} else if (requestHeaderFieldName.equals("hot") && requestHeaderFieldValue.equals("1")) {
							request.addHeader("Host","example.org");
							request.addHeader("Host","example.de");

						} else if (requestHeaderFieldName.equals("hot") && requestHeaderFieldValue.equals("2")) {
							request.addHeader("Host","example.org");
							request.addHeader(" Host","example.de");

						} else if (requestHeaderFieldName.equals("hot") && requestHeaderFieldValue.equals("3")) {
							request.addHeader(" Host", "example.org");
							request.addHeader("Host", "example.de");
						} else {
							request.setHeader(requestHeaderFieldName, requestHeaderFieldValue);
						}
					}


					HttpCoreContext ctx = new HttpCoreContext();

					client = http.HttpClientBuilder.create().setDefaultRequestConfig(RequestConfig.custom().setProxy(httpProxy).setRedirectsEnabled(false).build()).build();

					HttpResponse response = null;
					try{
						response = client.execute(request, ctx);
					} catch(HttpHostConnectException e){
						out.tell("Connection problem",self());
					}


					HttpRequest executedRequest = ctx.getRequest();


					//Generate RequestObject
					requestObject = Json.newObject();
					requestObject.put("requestId",requestId);
					requestObject.put("testCaseRequestNumber", testCaseRequestNumber++);
					requestLineObject = Json.newObject();
					requestLineObject.put("method",executedRequest.getRequestLine().getMethod());
					requestLineObject.put("url",executedRequest.getRequestLine().getUri());
					requestLineObject.put("protocol",executedRequest.getRequestLine().getProtocolVersion().getProtocol());
					requestLineObject.put("minor",executedRequest.getRequestLine().getProtocolVersion().getMinor());
					requestLineObject.put("major",executedRequest.getRequestLine().getProtocolVersion().getMajor());

					for(Header headerField : executedRequest.getAllHeaders()){

						requestHeaderFieldsObject.put(headerField.getName(),headerField.getValue());

					}

					requestObject.set("headerFields",requestHeaderFieldsObject);
					requestObject.set("requestLine",requestLineObject);
					requestObject.put("body",request.getBody());
					requestResponseDefinitionObject.set("request",requestObject);

					//Generate ResponseObject
					responseObject = Json.newObject();
					statusLineObject = Json.newObject();
					statusLineObject.put("statusCode",response.getStatusLine().getStatusCode());
					statusLineObject.put("reasonPhrase",response.getStatusLine().getReasonPhrase());
					statusLineObject.put("protocol",response.getStatusLine().getProtocolVersion().getProtocol());
					statusLineObject.put("minor",response.getStatusLine().getProtocolVersion().getMinor());
					statusLineObject.put("major",response.getStatusLine().getProtocolVersion().getMajor());

					ArrayList<String> rfcNonComplianceErrors = new ArrayList<>();


					String dateString = response.getFirstHeader("Date") != null ? response.getFirstHeader("Date").getValue() : "";

					Date dateFromDateHeaderField;

					try {
						dateFromDateHeaderField = format.parse(dateString);
					} catch (ParseException e) {
						dateFromDateHeaderField = new Date();
					}

					long responseTimeOfDateHeaderField = dateFromDateHeaderField.getTime() / 1000;

					responseObject.put("responseTimeOfDateHeaderField",responseTimeOfDateHeaderField * 1000);

					long maxAge = 1;

					long expirationTime =  new Date().getTime() / 1000;

					String cacheControl = "";

					//Check if response is stale
					HashMap<String,Long> maxAgeHm = new HashMap<>();
					if(response.getFirstHeader("Cache-Control") != null){
						cacheControl = response.getFirstHeader("Cache-Control").getValue();
						if(cacheControl.contains("s-maxage=")){
							maxAge = CacheTestHelper.getSMaxAge(cacheControl);
						} else if (cacheControl.contains("max-age=")) {
							maxAge = CacheTestHelper.getMaxAge(cacheControl);
						}

						expirationTime = responseTimeOfDateHeaderField  + maxAge;

					} else if(response.getFirstHeader("Expires") != null){
						try {
							expirationTime = format.parse(response.getFirstHeader("Expires").getValue()).getTime() / 1000;
						} catch (ParseException e) {
							e.printStackTrace();
						}
					}

					//Check if it a start request of test case to calculate expiration time

                    String cacheControlResponse = response.containsHeader("Cache-Control") ? response.getFirstHeader("Cache-Control").getValue() : "";

					responseObject.put("expirationTimeStartResponse",expirationTimeStartResponse);

					ArrayNode expectedValueErrors =  Json.newArray();

					responseObject.put("expirationTime",expirationTime * 1000);

					Long now = new Date().getTime() / 1000 ;

					responseObject.put("responseTimeReceived", now * 1000);

					if(expirationTime != -1 && now > expirationTime){
						responseObject.put("stale",true);

						if(response.getFirstHeader("Warning") == null){
							expectedValueErrors.add("No Warning header field");
						}
					} else if(expirationTime != -1 && now <= expirationTime){
						responseObject.put("stale",false);
					} else {
						responseObject.set("stale",null);
					}


					responseHeaderFieldsObject = Json.newObject();

					for (Header headerField : response.getAllHeaders()){
						if(headerField.getName().equals("Last-Modified")){
							lastModified = headerField.getValue();
						}

						responseHeaderFieldsObject.put(headerField.getName(),headerField.getValue());

					}

					StringBuffer result = new StringBuffer();
					String responseBody = "";
					String responseContentType = response.getFirstHeader("Content-Type") != null ? response.getFirstHeader("Content-Type").getValue() : "";

					if(responseContentType.equals("image/png")){
						//TODO
					} else if(responseContentType.isEmpty() || responseContentType.equals("application/json") || responseContentType.equals("application/xml") || responseContentType.equals("text/plain") || responseContentType.equals("text/css"))
					if ( response.getEntity() !=null) {
						try {
							BufferedReader rd = new BufferedReader(new InputStreamReader(
									response.getEntity().getContent()));
							result = new StringBuffer();
							responseBody = "";
							while ((responseBody = rd.readLine()) != null) {
								result.append(responseBody);
							}
						} catch (Exception e) {
							e.printStackTrace();
						}

					}

					responseBody = result.toString();

					responseObject.set("statusLine",statusLineObject);
					responseObject.set("headerFields",responseHeaderFieldsObject);
					responseObject.put("body",responseBody);

					String cacheHitType = "none";

					//testCase.set("response",responseObject);
					requestResponseDefinitionObject.set("response",responseObject);
					boolean cacheHitHeader = false;
					boolean cacheHitBody = false;

					if(response.getFirstHeader("X-Id") != null && response.getFirstHeader("X-Id").getValue() != null )
						responseObject.put("responseHeaderId",response.getFirstHeader("X-Id").getValue() != null ? response.getFirstHeader("X-Id").getValue() : "No Id" );
					else if(response.getFirstHeader("Id") != null && response.getFirstHeader("Id").getValue() != null)
						responseObject.put("responseHeaderId",response.getFirstHeader("Id").getValue());
                    if(response.getFirstHeader("X-Id") != null && requestIds.contains(response.getFirstHeader("X-Id").getValue()) ){

						cacheHitHeader = true;
						cacheHitType = "L";

                    } else if(response.getFirstHeader("Id") != null && requestIds.contains(response.getFirstHeader("Id").getValue())){

						cacheHitHeader = true;
						cacheHitType = "L";

					} else {
                    	if(responseContentType.equals("application/json") && !responseBody.isEmpty()){
                    		try {
								JsonNode bodyObject = Json.parse(responseBody);
								if(bodyObject.has("Id"))
									responseObject.put("responseBodyId",bodyObject.get("Id").asText());

								if(bodyObject.has("Id") && requestIds.contains(bodyObject.get("Id").asText())){

									cacheHitHeader = false;
									cacheHitType = "V";
									cacheHitBody = true;
								}
							} catch (RuntimeException e){

							}

						} else if(responseContentType.equals("application/xml")){
							DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
							DocumentBuilder dBuilder = null;
							Document doc = new DefaultDocument();
							try {
								dBuilder = dbFactory.newDocumentBuilder();
								InputSource is = new InputSource();
								is.setCharacterStream(new StringReader(responseBody));
								doc = dBuilder.parse(is);

								String responseIdXml = doc.getDocumentElement().getNodeValue();
								responseObject.put("responseBodyId",responseIdXml);
								if(requestIds.contains(responseIdXml)){
									cacheHitHeader = false;
									cacheHitType = "V";
									cacheHitBody = true;
								}
							} catch (Exception e) {
								cacheHitHeader = false;
							}

						} else if(responseContentType.equals("text/css")){
							//TODO
						}
                    }

					requestResponseDefinitionObject.put("cacheHitHeader",cacheHitHeader);
					requestResponseDefinitionObject.put("cacheHitBody",cacheHitBody);
					requestResponseDefinitionObject.put("cacheHitType",cacheHitType);
                    requestIds.add(requestId);

					//Check if response fulfills expected values
					ArrayNode expectedValuesObject = Json.newArray();
					ObjectNode complianceObject = Json.newObject();
					complianceObject.put("compliance",true);

					if(paramsObject.get("expectedValues").isArray()){

						expectedValuesObject = (ArrayNode) objectMapper.readTree(paramsObject.get("expectedValues").toString());
					}

					if(expectedValuesObject.size() > 0){
						complianceObject.put("compliance", false);
						for (JsonNode expectedValueObject : expectedValuesObject) {

							if(response.getStatusLine().getStatusCode() != CacheTestHelper.parseInt(expectedValueObject.get("statusCode").asText())){
								expectedValueErrors.add("Non-compliant status code");
							}
							boolean expectedCacheHitHeader = expectedValueObject.get("cacheHitHeader").asBoolean();
							boolean expectedCacheHitBody = expectedValueObject.get("cacheHitBody").asBoolean();
							if(cacheHitHeader != expectedCacheHitHeader){
								if(cacheHitHeader == true && expectedCacheHitHeader == false && cacheHitBody == false && expectedCacheHitBody == false)
									expectedValueErrors.add("Response must not be a cache hit");
								else if (cacheHitHeader == false && expectedCacheHitHeader == true && cacheHitBody == false && expectedCacheHitBody == false)
									expectedValueErrors.add("Response must be a cache hit");
								else if(cacheHitBody == true && expectedCacheHitBody == false && cacheHitHeader == false && expectedCacheHitHeader == false){
									expectedValueErrors.add("Cached response must not have an updated header");
								} else if(cacheHitBody == false && expectedCacheHitBody == true && cacheHitHeader == false && expectedCacheHitHeader == false){
									expectedValueErrors.add("Cached response must have an updated header");
								} else if(expectedCacheHitBody == true && cacheHitHeader == true){
									expectedValueErrors.add("Cached response must have an updated header");
								}
							} else if(cacheHitHeader == expectedCacheHitHeader && response.getStatusLine().getStatusCode() == response.getStatusLine().getStatusCode()){
								expectedValueErrors = Json.newArray();
							}
						}

						if(expectedValueErrors.size() == 0){
							complianceObject.put("compliance", true);
						}

						complianceObject.set("errors",expectedValueErrors);
						responseObject.set("compliance",complianceObject);
					} else {
						responseObject.set("compliance",null);
					}

					int pause = paramsObject.has("pause") ? paramsObject.get("pause").asInt() * 1000 : 1000;

					requestResponseDefinitionObject.put("pause",pause / 1000);
					requestResponseDefinitionObject.set("excpectedValues",expectedValuesObject);

					out.tell(requestResponseDefinitionObject.toString(), self());

					try {
						Thread.sleep(pause);
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
				}

			}
			scanner.close();
			out.tell("finish",self());


		}
	}

}
