import com.google.inject.AbstractModule;

import actors.WebSocketActor;

import java.util.HashMap;


/**
 * This class is a Guice module that tells Guice how to bind several
 * different types. This Guice module is created when the Play
 * application starts.
 *
 * Play will automatically use any class called `Module` that is in
 * the root package. You can create modules in other locations by
 * adding `play.modules.enabled` settings to the `application.conf`
 * configuration file.
 */
public class Module extends AbstractModule {
	
	
	public static HashMap<String,String> cacheHeaderFieldsResponse;
	public static HashMap<String,String> cacheHeaderFieldsRequest;

    @Override
    public void configure() {
		System.setProperty("webdriver.chrome.driver", "/Applications/chromedriver");
    	cacheHeaderFieldsRequest = new HashMap<>();
    	cacheHeaderFieldsRequest.put("req-cc", "Cache-Control");
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

}
