package com.example.optimize_xml_android.productlist.network;

import com.example.optimize_xml_android.productlist.common.Constants;
import okhttp3.OkHttpClient;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static ApiClient instance;
    private OkHttpClient okHttpClient;

    private ApiClient() {
        // Configure OkHttpClient with timeouts and interceptor for ngrok
        okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(Constants.CONNECT_TIMEOUT, TimeUnit.SECONDS)
                .readTimeout(Constants.READ_TIMEOUT, TimeUnit.SECONDS)
                .writeTimeout(Constants.WRITE_TIMEOUT, TimeUnit.SECONDS)
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
        return Constants.BASE_URL;
    }
}
