package com.example.optimize_xml_android.productlist.adapter;

import android.graphics.Paint;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.bumptech.glide.load.DataSource;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.bumptech.glide.load.engine.GlideException;
import com.bumptech.glide.request.RequestListener;
import com.bumptech.glide.request.RequestOptions;
import com.bumptech.glide.request.target.Target;
import com.example.optimize_xml_android.R;
import com.example.optimize_xml_android.productlist.model.Product;
import com.example.optimize_xml_android.utils.CloudinaryUrlUtil;
import java.text.DecimalFormat;

public class ProductViewHolder extends RecyclerView.ViewHolder {
    private static final String TAG = "CacheTest";
    
    private TextView tvProductName;
    private TextView tvPrice;
    private TextView tvBasePrice;
    private TextView tvDiscountPercent;
    private TextView tvSoldCount;
    private ImageView ivProductImage;

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
        
        // Load product image with optimization
        loadProductImage(product);
    }
    
    /**
     * Load product image with Glide
     * - Sử dụng Cloudinary optimization
     * - Enable Glide disk cache
     * - Glide tự động lazy load khi view visible
     */
    private void loadProductImage(Product product) {
        // Clear previous image to avoid showing wrong image when recycling
        Glide.with(itemView.getContext())
                .clear(ivProductImage);
        
        // Reset to placeholder
        ivProductImage.setImageDrawable(null);
        ivProductImage.setBackgroundColor(0xFFE0E0E0);
        
        // Get image URL
        String imageUrl = product.getImage();
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }
        
        // Optimize image URL with Cloudinary
        // Get image width from view (or use default)
        int imageWidth = ivProductImage.getWidth();
        if (imageWidth <= 0) {
            // Default width for product thumbnail (adjust based on your design)
            imageWidth = 400;
        }
        
        String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(imageUrl, imageWidth);
        final long startTime = System.currentTimeMillis();
        final String productName = product.getName();
        
        // Configure Glide request options
        RequestOptions options = new RequestOptions()
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache both original & resized
                .placeholder(R.color.placeholder_gray) // Placeholder while loading
                .error(R.color.placeholder_gray) // Error placeholder
                .centerCrop(); // Scale type
        
        // Load image with Glide + cache logging
        Glide.with(itemView.getContext())
                .load(optimizedUrl)
                .apply(options)
                .listener(new RequestListener<Drawable>() {
                    @Override
                    public boolean onLoadFailed(@Nullable GlideException e, Object model,
                            Target<Drawable> target, boolean isFirstResource) {
                        Log.e(TAG, "❌ FAILED: " + productName);
                        return false;
                    }

                    @Override
                    public boolean onResourceReady(Drawable resource, Object model,
                            Target<Drawable> target, DataSource dataSource, boolean isFirstResource) {
                        long time = System.currentTimeMillis() - startTime;
                        String source = dataSource == DataSource.MEMORY_CACHE ? "🟢 MEMORY" :
                                        dataSource == DataSource.DATA_DISK_CACHE || 
                                        dataSource == DataSource.RESOURCE_DISK_CACHE ? "🔵 DISK" :
                                        "🔴 NETWORK";
                        Log.d(TAG, source + " " + time + "ms | " + productName.substring(0, Math.min(25, productName.length())));
                        return false;
                    }
                })
                .into(ivProductImage);
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
