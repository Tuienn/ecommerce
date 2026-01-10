package com.example.optimize_xml_android.productlist.network;

import android.os.Handler;
import android.os.Looper;
import com.example.optimize_xml_android.productlist.model.Product;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProductApiService {
    private static final String SEARCH_ENDPOINT = "/v1/api/product/search";
    
    private ApiClient apiClient;
    private ExecutorService executorService;
    private Handler mainHandler;

    public ProductApiService() {
        this.apiClient = ApiClient.getInstance();
        this.executorService = Executors.newSingleThreadExecutor();
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    public void searchProducts(ApiCallback<List<Product>> callback) {
        executorService.execute(() -> {
            try {
                // Build request URL
                String url = apiClient.getBaseUrl() + SEARCH_ENDPOINT;
                
                // Create HTTP request
                Request request = new Request.Builder()
                        .url(url)
                        .get()
                        .build();
                
                // Execute request
                OkHttpClient client = apiClient.getOkHttpClient();
                Response response = client.newCall(request).execute();
                
                if (!response.isSuccessful()) {
                    String errorMsg = "HTTP Error: " + response.code();
                    postError(callback, errorMsg);
                    response.close();
                    return;
                }
                
                // Parse response body
                String responseBody = response.body().string();
                response.close();
                
                // Parse JSON
                JSONObject jsonResponse = new JSONObject(responseBody);
                
                // Check status code (API structure: { "code": 200, "message": "...", "data": {...} })
                int statusCode = jsonResponse.getInt("code");
                
                if (statusCode != 200) {
                    String errorMsg = jsonResponse.getString("message");
                    postError(callback, errorMsg);
                    return;
                }
                
                // Parse products from nested data.data structure
                JSONObject dataObj = jsonResponse.getJSONObject("data");
                JSONArray productsArray = dataObj.getJSONArray("data");
                
                List<Product> productList = new ArrayList<>();
                for (int i = 0; i < productsArray.length(); i++) {
                    JSONObject productJson = productsArray.getJSONObject(i);
                    Product product = Product.fromJson(productJson);
                    productList.add(product);
                }
                
                // Post success to main thread
                postSuccess(callback, productList);
                
            } catch (IOException e) {
                postError(callback, "Network error: " + e.getMessage());
            } catch (Exception e) {
                postError(callback, "Error: " + e.getMessage());
            }
        });
    }

    private void postSuccess(ApiCallback<List<Product>> callback, List<Product> data) {
        mainHandler.post(() -> callback.onSuccess(data));
    }

    private void postError(ApiCallback<List<Product>> callback, String errorMessage) {
        mainHandler.post(() -> callback.onError(errorMessage));
    }

    public void shutdown() {
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
        }
    }
}
