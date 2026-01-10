package com.example.optimize_xml_android.productlist.ui;

import android.os.Bundle;
import android.view.ViewStub;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.optimize_xml_android.R;
import com.example.optimize_xml_android.productlist.adapter.ProductAdapter;
import com.example.optimize_xml_android.productlist.model.Product;
import com.example.optimize_xml_android.productlist.network.ApiCallback;
import com.example.optimize_xml_android.productlist.network.ProductApiService;
import java.util.ArrayList;
import java.util.List;

public class ProductListActivity extends AppCompatActivity {
    private RecyclerView rvProducts;
    private ProductAdapter productAdapter;
    private List<Product> productList;
    
    // State management
    private StateManager stateManager;
    
    // API service
    private ProductApiService apiService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_list);

        // Initialize views
        rvProducts = findViewById(R.id.rvProducts);
        ViewStub viewStubLoading = findViewById(R.id.viewStubLoading);
        ViewStub viewStubEmpty = findViewById(R.id.viewStubEmpty);
        ViewStub viewStubError = findViewById(R.id.viewStubError);
        
        // Initialize StateManager
        stateManager = new StateManager(rvProducts, viewStubLoading, viewStubEmpty, viewStubError);
        stateManager.setOnRetryListener(this::loadProducts);
        
        // Set GridLayoutManager with 2 columns
        GridLayoutManager layoutManager = new GridLayoutManager(this, 2);
        rvProducts.setLayoutManager(layoutManager);
        
        // Initialize empty product list and adapter
        productList = new ArrayList<>();
        productAdapter = new ProductAdapter(productList);
        rvProducts.setAdapter(productAdapter);
        
        // Initialize API service
        apiService = new ProductApiService();
        
        // Load products from API
        loadProducts();
    }

    private void loadProducts() {
        // Show loading state
        stateManager.showLoading();
        
        // Call API
        apiService.searchProducts(new ApiCallback<List<Product>>() {
            @Override
            public void onSuccess(List<Product> data) {
                // Check if data is empty
                if (data == null || data.isEmpty()) {
                    stateManager.showEmpty();
                    return;
                }
                
                // Update product list
                productList.clear();
                productList.addAll(data);
                productAdapter.notifyDataSetChanged();
                
                // Show content
                stateManager.showContent();
            }

            @Override
            public void onError(String errorMessage) {
                // Show error state with message
                stateManager.showError(errorMessage);
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Shutdown API service executor
        if (apiService != null) {
            apiService.shutdown();
        }
    }
}
