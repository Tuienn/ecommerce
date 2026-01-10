package com.example.optimize_xml_android.productlist.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;
import com.example.optimize_xml_android.R;
import com.example.optimize_xml_android.productlist.model.Product;
import java.util.List;

public class ProductAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final int VIEW_TYPE_PRODUCT = 0;
    private static final int VIEW_TYPE_LOADING = 1;
    
    private List<Product> productList;
    private boolean isLoadingAdded = false;

    public ProductAdapter(List<Product> productList) {
        this.productList = productList;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == VIEW_TYPE_LOADING) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_loading, parent, false);
            return new LoadingViewHolder(view);
        } else {
            // Create CardView as parent for merge tag
            CardView cardView = new CardView(parent.getContext());
            cardView.setCardElevation(parent.getContext().getResources().getDimension(R.dimen.product_card_elevation));
            cardView.setRadius(parent.getContext().getResources().getDimension(R.dimen.product_corner_radius));
            cardView.setUseCompatPadding(true);
            
            ViewGroup.MarginLayoutParams layoutParams = new ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            int margin = (int) parent.getContext().getResources().getDimension(R.dimen.spacing_small);
            layoutParams.setMargins(margin, margin, margin, margin);
            cardView.setLayoutParams(layoutParams);
            
            // Inflate the item layout into the CardView
            LayoutInflater inflater = LayoutInflater.from(parent.getContext());
            inflater.inflate(R.layout.item_product, cardView, true);
            
            return new ProductViewHolder(cardView);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof ProductViewHolder) {
            Product product = productList.get(position);
            ((ProductViewHolder) holder).bind(product);
        }
        // LoadingViewHolder doesn't need binding
    }

    @Override
    public int getItemCount() {
        return productList.size();
    }
    
    @Override
    public int getItemViewType(int position) {
        return (position == productList.size() - 1 && isLoadingAdded) ? VIEW_TYPE_LOADING : VIEW_TYPE_PRODUCT;
    }
    
    public void addLoadingFooter() {
        if (!isLoadingAdded) {
            isLoadingAdded = true;
            productList.add(null);
            notifyItemInserted(productList.size() - 1);
        }
    }
    
    public void removeLoadingFooter() {
        if (isLoadingAdded) {
            isLoadingAdded = false;
            int position = productList.size() - 1;
            Product item = productList.get(position);
            
            if (item == null) {
                productList.remove(position);
                notifyItemRemoved(position);
            }
        }
    }
    
    public void addAll(List<Product> newProducts) {
        int startPosition = productList.size();
        productList.addAll(newProducts);
        notifyItemRangeInserted(startPosition, newProducts.size());
    }
    
    public void clear() {
        productList.clear();
        notifyDataSetChanged();
    }
    
    // Loading ViewHolder
    private static class LoadingViewHolder extends RecyclerView.ViewHolder {
        public LoadingViewHolder(@NonNull View itemView) {
            super(itemView);
        }
    }
}
