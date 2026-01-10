package com.example.optimize_xml_android.productlist.adapter;

import android.graphics.Paint;
import android.view.View;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.optimize_xml_android.R;
import com.example.optimize_xml_android.productlist.model.Product;
import java.text.DecimalFormat;

public class ProductViewHolder extends RecyclerView.ViewHolder {
    private TextView tvProductName;
    private TextView tvPrice;
    private TextView tvBasePrice;
    private TextView tvDiscountPercent;
    private TextView tvSoldCount;
    private View ivProductImage;

    private DecimalFormat priceFormatter;

    public ProductViewHolder(@NonNull View itemView) {
        super(itemView);
        
        // Initialize views
        tvProductName = itemView.findViewById(R.id.tvProductName);
        tvPrice = itemView.findViewById(R.id.tvPrice);
        tvBasePrice = itemView.findViewById(R.id.tvBasePrice);
        tvDiscountPercent = itemView.findViewById(R.id.tvDiscountPercent);
        tvSoldCount = itemView.findViewById(R.id.tvSoldCount);
        ivProductImage = itemView.findViewById(R.id.ivProductImage);
        
        // Set strikethrough for base price
        tvBasePrice.setPaintFlags(tvBasePrice.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
        
        // Initialize price formatter
        priceFormatter = new DecimalFormat("#,###");
    }

    public void bind(Product product) {
        // Set product name
        tvProductName.setText(product.getName());
        
        // Format and set prices
        String formattedPrice = priceFormatter.format(product.getPrice()) + "đ";
        String formattedBasePrice = priceFormatter.format(product.getBasePrice()) + "đ";
        
        tvPrice.setText(formattedPrice);
        tvBasePrice.setText(formattedBasePrice);
        
        // Format discount percent
        String discountText = "-" + product.getDiscountPercent() + "%";
        tvDiscountPercent.setText(discountText);
        
        // Format sold count
        String soldCountText = formatSoldCount(product.getSoldCount());
        tvSoldCount.setText(soldCountText);
    }

    private String formatSoldCount(int soldCount) {
        if (soldCount >= 1000) {
            double thousands = soldCount / 1000.0;
            DecimalFormat df = new DecimalFormat("#.#");
            return "Đã bán " + df.format(thousands) + "K";
        } else {
            return "Đã bán " + soldCount;
        }
    }
}
