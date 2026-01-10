package com.example.optimize_xml_android.productlist.ui;

import android.os.Bundle;
import android.view.ViewStub;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.optimize_xml_android.R;
import com.example.optimize_xml_android.productlist.adapter.ProductAdapter;
import com.example.optimize_xml_android.productlist.common.Constants;
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
    
    // Pagination
    private int currentPage = 1;
    private boolean isLoading = false;
    private boolean isLastPage = false;
    private GridLayoutManager layoutManager;

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
        stateManager.setOnRetryListener(this::loadFirstPage);
        
        // Get column count from resources (2 for mobile, 3 for tablets)
        int columnCount = getResources().getInteger(R.integer.grid_column_count);
        
        // Set GridLayoutManager with responsive columns
        layoutManager = new GridLayoutManager(this, columnCount);
        
        // Make loading item span full width
        GridLayoutManager.SpanSizeLookup spanSizeLookup = new GridLayoutManager.SpanSizeLookup() {
            @Override
            public int getSpanSize(int position) {
                // Loading item takes full width (all columns)
                return productAdapter.getItemViewType(position) == 1 ? columnCount : 1;
            }
        };
        // Enable caching to improve scroll performance
        spanSizeLookup.setSpanIndexCacheEnabled(true);
        layoutManager.setSpanSizeLookup(spanSizeLookup);
        
        rvProducts.setLayoutManager(layoutManager);
        
        // Initialize empty product list and adapter
        productList = new ArrayList<>();
        productAdapter = new ProductAdapter(productList);
        rvProducts.setAdapter(productAdapter);
        
        // Add pagination scroll listener
        rvProducts.addOnScrollListener(new PaginationScrollListener(layoutManager) {
            @Override
            protected void loadMoreItems() {
                loadNextPage();
            }

            @Override
            public boolean isLastPage() {
                return isLastPage;
            }

            @Override
            public boolean isLoading() {
                return isLoading;
            }
        });
        
        // Initialize API service
        apiService = new ProductApiService();
        
        // Load first page
        loadFirstPage();
    }

    private void loadFirstPage() {
        // Reset pagination state
        currentPage = 1;
        isLastPage = false;
        
        // Show loading state
        stateManager.showLoading();
        
        // Clear existing data
        productAdapter.clear();
        
        // Load first page
        loadProducts();
    }
    
    private void loadNextPage() {
        isLoading = true;
        currentPage++;
        
        // Add loading footer
        productAdapter.addLoadingFooter();
        
        // Load next page
        loadProducts();
    }

    private void loadProducts() {
        // Call API with pagination
        apiService.searchProducts(currentPage, Constants.PAGE_SIZE, new ApiCallback<List<Product>>() {
            @Override
            public void onSuccess(List<Product> data) {
                // Remove loading footer if exists
                productAdapter.removeLoadingFooter();
                isLoading = false;
                
                // Check if this is first page and data is empty
                if (currentPage == 1 && (data == null || data.isEmpty())) {
                    stateManager.showEmpty();
                    return;
                }
                
                // Check if this is the last page
                if (data == null || data.size() < Constants.PAGE_SIZE) {
                    isLastPage = true;
                }
                
                // Add new products to list
                if (data != null && !data.isEmpty()) {
                    if (currentPage == 1) {
                        // First page: replace all data
                        productList.clear();
                        productList.addAll(data);
                        productAdapter.notifyDataSetChanged();
                    } else {
                        // Next pages: append data
                        productAdapter.addAll(data);
                    }
                }
                
                // Show content if first page
                if (currentPage == 1) {
                    stateManager.showContent();
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Remove loading footer if exists
                productAdapter.removeLoadingFooter();
                isLoading = false;
                
                // Show error state only for first page
                if (currentPage == 1) {
                    stateManager.showError(errorMessage);
                } else {
                    // For subsequent pages, just reset to previous page
                    currentPage--;
                    // You could show a toast here if needed
                }
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
