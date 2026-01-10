package com.example.optimize_xml_android.productlist.network;

import android.util.Log;
import com.example.optimize_xml_android.productlist.common.Constants;
import okhttp3.Headers;
import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static ApiClient instance;
    private OkHttpClient okHttpClient;
    private static final String TAG = "ApiClient";

    private ApiClient() {
        // Configure OkHttpClient with timeouts and interceptors
        okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(Constants.CONNECT_TIMEOUT, TimeUnit.SECONDS)
                .readTimeout(Constants.READ_TIMEOUT, TimeUnit.SECONDS)
                .writeTimeout(Constants.WRITE_TIMEOUT, TimeUnit.SECONDS)
                // Interceptor for adding headers and logging
                .addInterceptor(chain -> {
                    Request originalRequest = chain.request();
                    
                    // Add ngrok-skip-browser-warning header
                    Request request = originalRequest.newBuilder()
                            .addHeader("ngrok-skip-browser-warning", "true")
                            .build();
                    
                    // Log Request
                    logRequest(request);
                    
                    // Execute request
                    long startTime = System.currentTimeMillis();
                    Response response = chain.proceed(request);
                    long endTime = System.currentTimeMillis();
                    
                    // Log Response
                    response = logResponse(response, endTime - startTime);
                    
                    return response;
                })
                .build();
    }

    /**
     * Log HTTP Request details
     */
    private void logRequest(Request request) {
        Log.d(TAG, "╔════════════════════════════════════════════════════════════════════");
        Log.d(TAG, "║ 📤 REQUEST");
        Log.d(TAG, "╠════════════════════════════════════════════════════════════════════");
        Log.d(TAG, "║ Method: " + request.method());
        Log.d(TAG, "║ URL: " + request.url());
        
        // Log Headers
        Headers headers = request.headers();
        if (headers.size() > 0) {
            Log.d(TAG, "║ Headers:");
            for (int i = 0; i < headers.size(); i++) {
                Log.d(TAG, "║   • " + headers.name(i) + ": " + headers.value(i));
            }
        }
        
        Log.d(TAG, "╚════════════════════════════════════════════════════════════════════");
    }
    
    /**
     * Log HTTP Response details
     */
    private Response logResponse(Response response, long duration) throws IOException {
        Log.d(TAG, "╔════════════════════════════════════════════════════════════════════");
        Log.d(TAG, "║ 📥 RESPONSE");
        Log.d(TAG, "╠════════════════════════════════════════════════════════════════════");
        Log.d(TAG, "║ URL: " + response.request().url());
        Log.d(TAG, "║ Status Code: " + response.code() + " " + response.message());
        Log.d(TAG, "║ Duration: " + duration + "ms");
        Log.d(TAG, "║ Protocol: " + response.protocol());
        
        // Log Response Headers
        Headers headers = response.headers();
        if (headers.size() > 0) {
            Log.d(TAG, "║ Headers:");
            for (int i = 0; i < headers.size(); i++) {
                String name = headers.name(i);
                String value = headers.value(i);
                
                // Highlight cache-related headers
                if (name.equalsIgnoreCase("Cache-Control") || 
                    name.equalsIgnoreCase("ETag") || 
                    name.equalsIgnoreCase("Last-Modified")) {
                    Log.d(TAG, "║   📦 " + name + ": " + value);
                } else {
                    Log.d(TAG, "║   • " + name + ": " + value);
                }
            }
        }
        
        // Log Response Body (if present)
        ResponseBody responseBody = response.body();
        if (responseBody != null) {
            MediaType contentType = responseBody.contentType();
            String bodyString = responseBody.string();
            
            Log.d(TAG, "║ Content-Type: " + contentType);
            Log.d(TAG, "║ Content-Length: " + bodyString.length() + " bytes");
            
            // Log body (truncate if too long)
            if (bodyString.length() > 1000) {
                Log.d(TAG, "║ Body (truncated):");
                Log.d(TAG, "║ " + bodyString.substring(0, 1000) + "...");
                Log.d(TAG, "║ (Total: " + bodyString.length() + " bytes)");
            } else {
                Log.d(TAG, "║ Body:");
                // Split body into multiple lines for better readability
                String[] lines = bodyString.split("\n");
                for (String line : lines) {
                    if (line.length() > 100) {
                        // Split long lines
                        for (int i = 0; i < line.length(); i += 100) {
                            int end = Math.min(i + 100, line.length());
                            Log.d(TAG, "║ " + line.substring(i, end));
                        }
                    } else {
                        Log.d(TAG, "║ " + line);
                    }
                }
            }
            
            // Important: Create new response with the body we just read
            // (because body can only be consumed once)
            response = response.newBuilder()
                    .body(ResponseBody.create(bodyString, contentType))
                    .build();
        }
        
        Log.d(TAG, "╚════════════════════════════════════════════════════════════════════");
        
        return response;
    }

    public static synchronized ApiClient getInstance() {
        if (instance == null) {
            instance = new ApiClient();
        }
        return instance;
    }

    public OkHttpClient getOkHttpClient() {
        return okHttpClient;
    }

    public String getBaseUrl() {
        return Constants.BASE_URL;
    }
}
