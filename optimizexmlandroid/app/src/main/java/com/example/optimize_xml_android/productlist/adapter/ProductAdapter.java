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

public class ProductAdapter extends RecyclerView.Adapter<ProductViewHolder> {
    private List<Product> productList;

    public ProductAdapter(List<Product> productList) {
        this.productList = productList;
    }

    @NonNull
    @Override
    public ProductViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
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

    @Override
    public void onBindViewHolder(@NonNull ProductViewHolder holder, int position) {
        Product product = productList.get(position);
        holder.bind(product);
    }

    @Override
    public int getItemCount() {
        return productList.size();
    }
}
