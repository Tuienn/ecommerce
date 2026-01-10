package com.example.optimize_xml_android.productlist.network;

import okhttp3.OkHttpClient;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static final String BASE_URL = "https://584840a9c095.ngrok-free.app";
    private static ApiClient instance;
    private OkHttpClient okHttpClient;

    private ApiClient() {
        // Configure OkHttpClient with timeouts and interceptor for ngrok
        okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(chain -> {
                    // Add ngrok-skip-browser-warning header to bypass ngrok warning page
                    return chain.proceed(
                        chain.request()
                            .newBuilder()
                            .addHeader("ngrok-skip-browser-warning", "true")
                            .build()
                    );
                })
                .build();
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
        return BASE_URL;
    }
}
