package com.example.optimize_xml_android.productlist.ui;

import android.view.View;
import android.view.ViewStub;
import android.widget.Button;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import com.example.optimize_xml_android.R;

public class StateManager {
    private RecyclerView rvProducts;
    private ViewStub viewStubLoading;
    private ViewStub viewStubEmpty;
    private ViewStub viewStubError;
    
    // Inflated views cache
    private View loadingView;
    private View emptyView;
    private View errorView;
    
    // Retry listener
    private OnRetryListener retryListener;

    public StateManager(RecyclerView rvProducts, 
                       ViewStub viewStubLoading,
                       ViewStub viewStubEmpty, 
                       ViewStub viewStubError) {
        this.rvProducts = rvProducts;
        this.viewStubLoading = viewStubLoading;
        this.viewStubEmpty = viewStubEmpty;
        this.viewStubError = viewStubError;
    }

    public void showLoading() {
        hideAllStates();
        
        if (loadingView == null && viewStubLoading != null) {
            loadingView = viewStubLoading.inflate();
        }
        
        if (loadingView != null) {
            loadingView.setVisibility(View.VISIBLE);
        }
    }

    public void showContent() {
        hideAllStates();
        rvProducts.setVisibility(View.VISIBLE);
    }

    public void showEmpty() {
        hideAllStates();
        
        if (emptyView == null && viewStubEmpty != null) {
            emptyView = viewStubEmpty.inflate();
            setupRetryButton(emptyView);
        }
        
        if (emptyView != null) {
            emptyView.setVisibility(View.VISIBLE);
        }
    }

    public void showError(String errorMessage) {
        hideAllStates();
        
        if (errorView == null && viewStubError != null) {
            errorView = viewStubError.inflate();
            setupRetryButton(errorView);
        }
        
        if (errorView != null) {
            // Update error message
            TextView tvErrorMessage = errorView.findViewById(R.id.tvErrorMessage);
            if (tvErrorMessage != null) {
                tvErrorMessage.setText(errorMessage);
            }
            
            errorView.setVisibility(View.VISIBLE);
        }
    }

    private void hideAllStates() {
        // Hide RecyclerView
        rvProducts.setVisibility(View.GONE);
        
        // Hide all inflated state views
        if (loadingView != null) {
            loadingView.setVisibility(View.GONE);
        }
        if (emptyView != null) {
            emptyView.setVisibility(View.GONE);
        }
        if (errorView != null) {
            errorView.setVisibility(View.GONE);
        }
    }

    private void setupRetryButton(View view) {
        Button btnRetry = view.findViewById(R.id.btnRetry);
        if (btnRetry != null && retryListener != null) {
            btnRetry.setOnClickListener(v -> retryListener.onRetry());
        }
    }

    public void setOnRetryListener(OnRetryListener listener) {
        this.retryListener = listener;
        
        // Setup retry button for already inflated views
        if (emptyView != null) {
            setupRetryButton(emptyView);
        }
        if (errorView != null) {
            setupRetryButton(errorView);
        }
    }

    public interface OnRetryListener {
        void onRetry();
    }
}
