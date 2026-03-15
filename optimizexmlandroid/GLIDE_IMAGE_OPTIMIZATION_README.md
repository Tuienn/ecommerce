# Glide - Tối Ưu Hóa Ảnh Trong RecyclerView

## Tổng quan

**Glide** là thư viện image loading mạnh mẽ cho Android, được thiết kế để load và cache ảnh hiệu quả. Trong RecyclerView, Glide đóng vai trò quan trọng trong việc tối ưu performance và user experience.

**Tại sao dùng Glide?**

- ✅ **Caching thông minh**: Memory cache + Disk cache
- ✅ **Lazy loading**: Chỉ load ảnh khi view visible
- ✅ **Lifecycle aware**: Tự động cancel requests khi Activity/Fragment destroyed
- ✅ **Image transformation**: Resize, crop, blur, etc.
- ✅ **Placeholder & Error handling**: UX tốt hơn
- ✅ **Tích hợp RecyclerView**: Tự động xử lý recycle

---

## 1. Vấn Đề Khi Load Ảnh Trong RecyclerView

### 1.1. Vấn Đề Không Dùng Glide

```java
// ❌ BAD - Load ảnh trực tiếp (KHÔNG NÊN)
public void bind(Product product) {
    // Vấn đề 1: Blocking UI thread
    Bitmap bitmap = BitmapFactory.decodeStream(
        new URL(product.getImage()).openStream()
    );
    ivProductImage.setImageBitmap(bitmap);

    // Vấn đề 2: Không cache → Load lại mỗi lần scroll
    // Vấn đề 3: Memory leak → Bitmap không được release
    // Vấn đề 4: Recycle issue → Hiển thị ảnh sai khi scroll nhanh
}
```

**Hậu quả**:

- 🔴 **ANR (Application Not Responding)**: UI thread bị block
- 🔴 **Lag khi scroll**: Load ảnh mỗi lần scroll
- 🔴 **Memory leak**: Out of memory crash
- 🔴 **Wrong image**: Ảnh hiển thị sai do recycle

---

### 1.2. Giải Pháp: Glide

```java
// ✅ GOOD - Sử dụng Glide
public void bind(Product product) {
    Glide.with(itemView.getContext())
        .load(product.getImage())
        .into(ivProductImage);

    // ✅ Async loading → Không block UI
    // ✅ Auto cache → Không load lại
    // ✅ Auto memory management → Không leak
    // ✅ Auto handle recycle → Không hiển thị sai
}
```

---

## 2. Glide Architecture

### 2.1. Cơ Chế Hoạt Động

```
┌─────────────────────────────────────────────────────────────────┐
│                      GLIDE ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

REQUEST FLOW:
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│  1. Glide.with(context).load(url).into(imageView)           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  BƯỚC 1: Check Memory Cache    │
        │  (LruCache trong RAM)          │
        └────────────┬───────────────────┘
                     │
         ┌───────────┴───────────┐
         │ Found?                │
         └───┬───────────────┬───┘
             │ YES           │ NO
             ▼               ▼
    ┌────────────────┐  ┌────────────────────────────────┐
    │ 🟢 MEMORY HIT  │  │  BƯỚC 2: Check Disk Cache      │
    │ Return bitmap  │  │  (File trong storage)          │
    │ (~1-5ms)       │  └────────────┬───────────────────┘
    └────────────────┘               │
                         ┌───────────┴───────────┐
                         │ Found?                │
                         └───┬───────────────┬───┘
                             │ YES           │ NO
                             ▼               ▼
                    ┌────────────────┐  ┌────────────────────────────┐
                    │ 🔵 DISK HIT    │  │  BƯỚC 3: Download Network  │
                    │ Decode file    │  │  (HTTP request)            │
                    │ (~10-50ms)     │  └────────────┬───────────────┘
                    └────────┬───────┘               │
                             │                       ▼
                             │              ┌────────────────────────┐
                             │              │ 🔴 NETWORK             │
                             │              │ Download image         │
                             │              │ (~100-1000ms)          │
                             │              └────────────┬───────────┘
                             │                           │
                             └───────────┬───────────────┘
                                         │
                                         ▼
                        ┌────────────────────────────────┐
                        │  BƯỚC 4: Transform             │
                        │  (Resize, crop, etc)           │
                        └────────────┬───────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────────────┐
                        │  BƯỚC 5: Cache                 │
                        │  - Save to disk cache          │
                        │  - Save to memory cache        │
                        └────────────┬───────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────────────┐
                        │  BƯỚC 6: Display               │
                        │  imageView.setImageBitmap()    │
                        └────────────────────────────────┘


CACHE HIERARCHY:
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  Level 1: MEMORY CACHE (RAM)                               │
│  ├─ Size: ~50MB (configurable)                             │
│  ├─ Speed: ⚡⚡⚡ Fastest (~1-5ms)                          │
│  ├─ Lifetime: Until app killed                             │
│  └─ Use case: Scroll qua lại trong cùng 1 session         │
├─────────────────────────────────────────────────────────────┤
│  Level 2: DISK CACHE (Storage)                             │
│  ├─ Size: ~250MB (configurable)                            │
│  ├─ Speed: ⚡⚡ Fast (~10-50ms)                            │
│  ├─ Lifetime: Until cleared or expired                     │
│  └─ Use case: Mở app lại, vẫn có cache                    │
├─────────────────────────────────────────────────────────────┤
│  Level 3: NETWORK (Internet)                               │
│  ├─ Size: N/A                                              │
│  ├─ Speed: ⚡ Slow (~100-1000ms)                           │
│  ├─ Lifetime: N/A                                          │
│  └─ Use case: Lần đầu load hoặc cache expired             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Chi Tiết

### 3.1. Setup Glide

#### Thêm Dependency

```gradle
// build.gradle (app level)
dependencies {
    // Glide
    implementation 'com.github.bumptech.glide:glide:4.16.0'
    annotationProcessor 'com.github.bumptech.glide:compiler:4.16.0'
}
```

#### Permissions

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

### 3.2. Basic Usage

```java
// Cách đơn giản nhất
Glide.with(context)
    .load(imageUrl)
    .into(imageView);
```

**Giải thích**:

- `with(context)`: Bind với lifecycle của Activity/Fragment
- `load(imageUrl)`: URL của ảnh cần load
- `into(imageView)`: ImageView để hiển thị

---

### 3.3. ProductViewHolder Implementation

```java
public class ProductViewHolder extends RecyclerView.ViewHolder {

    // ===== BIẾN INSTANCE =====
    private static final String TAG = "CacheTest";

    private TextView tvProductName;
    private TextView tvPrice;
    private TextView tvBasePrice;
    private TextView tvDiscountPercent;
    private TextView tvSoldCount;
    private ImageView ivProductImage;  // ImageView để load ảnh

    private DecimalFormat priceFormatter;

    // ===== CONSTRUCTOR =====
    public ProductViewHolder(@NonNull View itemView) {
        super(itemView);

        // findViewById() - Chỉ 1 lần
        tvProductName = itemView.findViewById(R.id.tvProductName);
        tvPrice = itemView.findViewById(R.id.tvPrice);
        tvBasePrice = itemView.findViewById(R.id.tvBasePrice);
        tvDiscountPercent = itemView.findViewById(R.id.tvDiscountPercent);
        tvSoldCount = itemView.findViewById(R.id.tvSoldCount);
        ivProductImage = itemView.findViewById(R.id.ivProductImage);

        // Setup views
        tvBasePrice.setPaintFlags(tvBasePrice.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
        priceFormatter = new DecimalFormat("#,###");
    }

    // ===== BIND METHOD =====
    public void bind(Product product) {
        // Set text data
        tvProductName.setText(product.getName());
        tvPrice.setText(priceFormatter.format(product.getPrice()) + "đ");
        tvBasePrice.setText(priceFormatter.format(product.getBasePrice()) + "đ");
        tvDiscountPercent.setText("-" + product.getDiscountPercent() + "%");
        tvSoldCount.setText(formatSoldCount(product.getSoldCount()));

        // ===== LOAD IMAGE WITH GLIDE =====
        loadProductImage(product);
    }

    // ===== IMAGE LOADING METHOD =====
    /**
     * Load product image with Glide
     * - Sử dụng Cloudinary optimization
     * - Enable Glide disk cache
     * - Glide tự động lazy load khi view visible
     */
    private void loadProductImage(Product product) {
        // ===== BƯỚC 1: CLEAR IMAGE CŨ =====
        // ⚠️ QUAN TRỌNG: Tránh hiển thị ảnh cũ khi recycle ViewHolder

        Glide.with(itemView.getContext())
                .clear(ivProductImage);

        // Reset ImageView về placeholder
        ivProductImage.setImageDrawable(null);
        ivProductImage.setBackgroundColor(0xFFE0E0E0); // Gray background

        // ===== BƯỚC 2: VALIDATE IMAGE URL =====
        String imageUrl = product.getImage();
        if (imageUrl == null || imageUrl.isEmpty()) {
            // Không có URL → giữ placeholder
            return;
        }

        // ===== BƯỚC 3: OPTIMIZE IMAGE URL =====
        // Sử dụng Cloudinary để optimize ảnh trước khi load

        // Lấy width của ImageView để request đúng size
        int imageWidth = ivProductImage.getWidth();
        if (imageWidth <= 0) {
            // Nếu view chưa được measure, dùng default width
            imageWidth = 400; // 400px cho thumbnail
        }

        // Transform URL với Cloudinary
        String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(imageUrl, imageWidth);

        // ===== BƯỚC 4: SETUP MONITORING =====
        // Track thời gian load và cache source
        final long startTime = System.currentTimeMillis();
        final String productName = product.getName();

        // ===== BƯỚC 5: CONFIGURE GLIDE OPTIONS =====
        RequestOptions options = new RequestOptions()
                // Cache strategy
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                // DiskCacheStrategy.ALL: Cache cả original và resized image
                // - Original: Ảnh gốc từ network
                // - Resized: Ảnh đã transform (resize, crop)
                // → Lần sau không cần download lại hoặc transform lại

                // Placeholder (hiển thị khi đang load)
                .placeholder(R.color.placeholder_gray)

                // Error placeholder (hiển thị khi load fail)
                .error(R.color.placeholder_gray)

                // Scale type
                .centerCrop();
                // centerCrop(): Scale ảnh để fill ImageView, crop phần thừa
                // Alternatives:
                // - fitCenter(): Scale để fit, không crop
                // - centerInside(): Giữ nguyên tỷ lệ, không scale up

        // ===== BƯỚC 6: LOAD IMAGE WITH GLIDE =====
        Glide.with(itemView.getContext())
                // Load URL
                .load(optimizedUrl)

                // Apply options
                .apply(options)

                // Add listener để monitor
                .listener(new RequestListener<Drawable>() {
                    // ===== CALLBACK: LOAD FAILED =====
                    @Override
                    public boolean onLoadFailed(
                            @Nullable GlideException e,
                            Object model,
                            Target<Drawable> target,
                            boolean isFirstResource) {

                        // Log error
                        Log.e(TAG, "❌ FAILED: " + productName);

                        // Return false → Glide sẽ hiển thị error placeholder
                        return false;
                    }

                    // ===== CALLBACK: LOAD SUCCESS =====
                    @Override
                    public boolean onResourceReady(
                            Drawable resource,
                            Object model,
                            Target<Drawable> target,
                            DataSource dataSource,
                            boolean isFirstResource) {

                        // Tính thời gian load
                        long time = System.currentTimeMillis() - startTime;

                        // Xác định cache source
                        String source;
                        if (dataSource == DataSource.MEMORY_CACHE) {
                            source = "🟢 MEMORY";
                            // Load từ RAM → Rất nhanh (~1-5ms)

                        } else if (dataSource == DataSource.DATA_DISK_CACHE ||
                                   dataSource == DataSource.RESOURCE_DISK_CACHE) {
                            source = "🔵 DISK";
                            // Load từ disk → Nhanh (~10-50ms)

                        } else {
                            source = "🔴 NETWORK";
                            // Download từ network → Chậm (~100-1000ms)
                        }

                        // Log kết quả
                        Log.d(TAG, source + " " + time + "ms | " +
                            productName.substring(0, Math.min(25, productName.length())));

                        // Return false → Glide sẽ hiển thị ảnh vào ImageView
                        return false;
                    }
                })

                // Target ImageView
                .into(ivProductImage);
    }

    // ===== HELPER METHOD =====
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
```

---

## 4. Cloudinary URL Optimization

### 4.1. CloudinaryUrlUtil Class

```java
public class CloudinaryUrlUtil {

    /**
     * Optimize image URL với Cloudinary transformations
     *
     * @param originalUrl URL gốc từ Cloudinary
     * @param width Width mong muốn (pixels)
     * @return Optimized URL với transformations
     */
    public static String optimizeToWebp(String originalUrl, int width) {
        // Validate URL
        if (originalUrl == null || !originalUrl.contains("/upload/")) {
            return originalUrl;
        }

        // ===== CLOUDINARY TRANSFORMATIONS =====

        // w_400: Width = 400px
        // c_limit: Crop mode = limit (không scale up nếu ảnh nhỏ hơn)
        // f_auto: Format = auto (tự chọn WebP, AVIF, hoặc JPEG tùy browser)
        // q_auto: Quality = auto (tự điều chỉnh quality để balance size/quality)

        String transform = "w_" + width + ",c_limit,f_auto,q_auto";

        // ===== INSERT TRANSFORMATION VÀO URL =====

        // Original URL: https://res.cloudinary.com/demo/upload/sample.jpg
        // Split by "/upload/"
        String[] parts = originalUrl.split("/upload/", 2);

        // Rebuild URL:
        // https://res.cloudinary.com/demo/upload/w_400,c_limit,f_auto,q_auto/sample.jpg
        return parts[0] + "/upload/" + transform + "/" + parts[1];
    }
}
```

**Giải thích Cloudinary Transformations**:

1. **`w_400`** (Width):

   - Resize ảnh về width = 400px
   - Height tự động scale theo tỷ lệ

2. **`c_limit`** (Crop mode):

   - Không scale up nếu ảnh gốc nhỏ hơn
   - Chỉ scale down nếu ảnh lớn hơn
   - Giữ nguyên aspect ratio

3. **`f_auto`** (Format):

   - Tự động chọn format tốt nhất:
     - WebP: Nhẹ hơn JPEG ~30%, support Chrome/Firefox
     - AVIF: Nhẹ hơn WebP ~20%, support Chrome mới
     - JPEG: Fallback cho browser cũ

4. **`q_auto`** (Quality):
   - Tự động điều chỉnh quality dựa trên:
     - Nội dung ảnh (photo vs graphic)
     - Kích thước ảnh
     - Network speed
   - Balance giữa quality và file size

**Lợi ích**:

- ✅ Giảm file size ~50-70%
- ✅ Load nhanh hơn
- ✅ Tiết kiệm bandwidth
- ✅ Tự động optimize cho từng device

---

### 4.2. Ví Dụ URL Transformation

```
ORIGINAL URL:
https://res.cloudinary.com/demo/upload/v1234567890/products/shoe.jpg
File size: 500KB
Dimensions: 2000x2000px

↓ Transform với w_400,c_limit,f_auto,q_auto ↓

OPTIMIZED URL:
https://res.cloudinary.com/demo/upload/w_400,c_limit,f_auto,q_auto/v1234567890/products/shoe.jpg
File size: 50KB (giảm 90%!)
Dimensions: 400x400px
Format: WebP (nếu browser support)
Quality: Auto-optimized

RESULT:
- Load time: 500ms → 50ms (10x faster)
- Bandwidth: 500KB → 50KB (10x less)
- Quality: Vẫn đẹp, không nhận ra khác biệt
```

---

## 5. Glide Configuration Options

### 5.1. DiskCacheStrategy

```java
// ===== CACHE STRATEGIES =====

// 1. DiskCacheStrategy.ALL (RECOMMENDED)
.diskCacheStrategy(DiskCacheStrategy.ALL)
// Cache CẢ original và transformed image
// - Original: Ảnh gốc từ network
// - Transformed: Ảnh đã resize/crop
// → Lần sau không cần download hoặc transform lại

// 2. DiskCacheStrategy.AUTOMATIC (Default)
.diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
// Glide tự quyết định cache gì
// - Local images: Cache transformed only
// - Remote images: Cache original only

// 3. DiskCacheStrategy.DATA
.diskCacheStrategy(DiskCacheStrategy.DATA)
// Chỉ cache original image
// → Mỗi lần load phải transform lại

// 4. DiskCacheStrategy.RESOURCE
.diskCacheStrategy(DiskCacheStrategy.RESOURCE)
// Chỉ cache transformed image
// → Nếu transform khác phải download lại

// 5. DiskCacheStrategy.NONE
.diskCacheStrategy(DiskCacheStrategy.NONE)
// KHÔNG cache gì cả
// → Mỗi lần load phải download lại
```

**Recommendation**: Dùng `DiskCacheStrategy.ALL` cho RecyclerView

---

### 5.2. Placeholder & Error

```java
// ===== PLACEHOLDER =====
// Hiển thị khi đang load

// Option 1: Color resource
.placeholder(R.color.placeholder_gray)

// Option 2: Drawable resource
.placeholder(R.drawable.ic_placeholder)

// Option 3: Drawable object
.placeholder(new ColorDrawable(Color.GRAY))

// ===== ERROR PLACEHOLDER =====
// Hiển thị khi load failed

// Option 1: Color resource
.error(R.color.error_red)

// Option 2: Drawable resource
.error(R.drawable.ic_error)

// Option 3: Same as placeholder
.error(R.color.placeholder_gray)

// ===== FALLBACK =====
// Hiển thị khi URL = null

.fallback(R.drawable.ic_no_image)
```

---

### 5.3. Scale Types

```java
// ===== SCALE TYPES =====

// 1. centerCrop() (RECOMMENDED cho RecyclerView)
.centerCrop()
// Scale ảnh để FILL ImageView
// Crop phần thừa nếu aspect ratio khác
// → Không có khoảng trống, nhưng có thể mất 1 phần ảnh

// 2. fitCenter()
.fitCenter()
// Scale ảnh để FIT trong ImageView
// Giữ nguyên toàn bộ ảnh
// → Có thể có khoảng trống nếu aspect ratio khác

// 3. centerInside()
.centerInside()
// Giữ nguyên kích thước nếu ảnh nhỏ hơn ImageView
// Scale down nếu ảnh lớn hơn
// → Không scale up, giữ chất lượng

// 4. circleCrop()
.circleCrop()
// Crop ảnh thành hình tròn
// → Dùng cho avatar

// 5. Custom transformation
.transform(new RoundedCorners(16))
// Bo góc ảnh với radius = 16dp
```

**Recommendation**: Dùng `centerCrop()` cho product images

---

### 5.4. Size & Override

```java
// ===== SIZE CONTROL =====

// 1. Auto size (Default)
// Glide tự detect size từ ImageView
.into(imageView)

// 2. Override size
.override(400, 400)
// Force resize về 400x400px
// → Dùng khi ImageView chưa có size (wrap_content)

// 3. Override với Target.SIZE_ORIGINAL
.override(Target.SIZE_ORIGINAL)
// Load ảnh với size gốc
// ⚠️ Cẩn thận với ảnh lớn → Out of memory

// ===== EXAMPLE: Dynamic size =====
int imageWidth = ivProductImage.getWidth();
if (imageWidth <= 0) {
    imageWidth = 400; // Default
}

Glide.with(context)
    .load(url)
    .override(imageWidth, imageWidth)
    .into(imageView);
```

---

## 6. Glide Lifecycle Management

### 6.1. Context Types

```java
// ===== GLIDE.WITH() OPTIONS =====

// 1. Activity context (RECOMMENDED)
Glide.with(activity)
    .load(url)
    .into(imageView);
// → Auto cancel khi Activity destroyed
// → Tránh memory leak

// 2. Fragment context (RECOMMENDED)
Glide.with(fragment)
    .load(url)
    .into(imageView);
// → Auto cancel khi Fragment destroyed

// 3. View context
Glide.with(view)
    .load(url)
    .into(imageView);
// → Bind với lifecycle của View

// 4. Application context (⚠️ CẨN THẬN)
Glide.with(applicationContext)
    .load(url)
    .into(imageView);
// → KHÔNG auto cancel
// → Có thể leak nếu ImageView destroyed
// → Chỉ dùng khi cần load background

// ===== TRONG RECYCLERVIEW =====
// Dùng itemView.getContext() (View context)
Glide.with(itemView.getContext())
    .load(url)
    .into(imageView);
```

---

### 6.2. Cancel Requests

```java
// ===== CANCEL GLIDE REQUEST =====

// 1. Clear specific ImageView
Glide.with(context).clear(imageView);
// → Cancel request đang load cho ImageView này
// → Dùng trong bind() để tránh hiển thị ảnh sai

// 2. Pause all requests
Glide.with(context).pauseRequests();
// → Pause tất cả requests
// → Dùng khi scroll nhanh

// 3. Resume requests
Glide.with(context).resumeRequests();
// → Resume requests đã pause

// ===== EXAMPLE: Pause khi scroll nhanh =====
recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
    @Override
    public void onScrollStateChanged(@NonNull RecyclerView recyclerView, int newState) {
        if (newState == RecyclerView.SCROLL_STATE_IDLE) {
            // Scroll dừng → Resume
            Glide.with(context).resumeRequests();
        } else {
            // Đang scroll → Pause
            Glide.with(context).pauseRequests();
        }
    }
});
```

---

## 7. RecyclerView Best Practices

### 7.1. Clear Image Khi Recycle

```java
// ✅ GOOD - Clear image trước khi load mới
public void bind(Product product) {
    // BƯỚC 1: Clear image cũ
    Glide.with(itemView.getContext()).clear(ivProductImage);

    // BƯỚC 2: Reset placeholder
    ivProductImage.setImageDrawable(null);
    ivProductImage.setBackgroundColor(0xFFE0E0E0);

    // BƯỚC 3: Load image mới
    Glide.with(itemView.getContext())
        .load(product.getImage())
        .into(ivProductImage);
}

// ❌ BAD - Không clear
public void bind(Product product) {
    // Vấn đề: Khi scroll nhanh, ảnh cũ vẫn hiển thị
    // cho đến khi ảnh mới load xong
    Glide.with(itemView.getContext())
        .load(product.getImage())
        .into(ivProductImage);
}
```

**Tại sao cần clear?**

- ViewHolder được recycle → ImageView hiển thị ảnh cũ
- Nếu không clear → User thấy ảnh cũ flash trước khi ảnh mới load
- Clear → Hiển thị placeholder → UX tốt hơn

---

### 7.2. Optimize URL Trước Khi Load

```java
// ✅ GOOD - Optimize URL với Cloudinary
public void bind(Product product) {
    String imageUrl = product.getImage();

    // Get ImageView width
    int imageWidth = ivProductImage.getWidth();
    if (imageWidth <= 0) {
        imageWidth = 400; // Default
    }

    // Optimize URL
    String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(imageUrl, imageWidth);

    // Load optimized URL
    Glide.with(itemView.getContext())
        .load(optimizedUrl)
        .into(ivProductImage);
}

// ❌ BAD - Load original URL
public void bind(Product product) {
    // Vấn đề: Load ảnh 2000x2000px cho ImageView 400x400px
    // → Lãng phí bandwidth và memory
    Glide.with(itemView.getContext())
        .load(product.getImage())
        .into(ivProductImage);
}
```

---

### 7.3. Use RequestOptions

```java
// ✅ GOOD - Reuse RequestOptions
public class ProductViewHolder extends RecyclerView.ViewHolder {
    // Static RequestOptions → Tạo 1 lần, dùng cho tất cả
    private static final RequestOptions REQUEST_OPTIONS = new RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .placeholder(R.color.placeholder_gray)
        .error(R.color.placeholder_gray)
        .centerCrop();

    public void bind(Product product) {
        Glide.with(itemView.getContext())
            .load(optimizedUrl)
            .apply(REQUEST_OPTIONS) // Reuse
            .into(ivProductImage);
    }
}

// ❌ BAD - Tạo RequestOptions mỗi lần
public void bind(Product product) {
    // Vấn đề: Tạo object mới mỗi lần bind → Lãng phí memory
    RequestOptions options = new RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .placeholder(R.color.placeholder_gray)
        .centerCrop();

    Glide.with(itemView.getContext())
        .load(url)
        .apply(options)
        .into(ivProductImage);
}
```

---

### 7.4. Preload Images

```java
// Preload images cho items sắp hiển thị
recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
    @Override
    public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
        // Get last visible item position
        int lastVisiblePosition = layoutManager.findLastVisibleItemPosition();

        // Preload next 5 items
        for (int i = lastVisiblePosition + 1; i <= lastVisiblePosition + 5; i++) {
            if (i < productList.size()) {
                Product product = productList.get(i);
                String url = CloudinaryUrlUtil.optimizeToWebp(product.getImage(), 400);

                // Preload vào cache (không hiển thị)
                Glide.with(context)
                    .load(url)
                    .preload();
            }
        }
    }
});
```

---

## 8. Monitoring & Debugging

### 8.1. Log Cache Source

```java
Glide.with(context)
    .load(url)
    .listener(new RequestListener<Drawable>() {
        @Override
        public boolean onResourceReady(
                Drawable resource,
                Object model,
                Target<Drawable> target,
                DataSource dataSource,
                boolean isFirstResource) {

            // Log cache source
            String source = "";
            switch (dataSource) {
                case MEMORY_CACHE:
                    source = "🟢 MEMORY CACHE";
                    break;
                case DATA_DISK_CACHE:
                case RESOURCE_DISK_CACHE:
                    source = "🔵 DISK CACHE";
                    break;
                case REMOTE:
                    source = "🔴 NETWORK";
                    break;
                case LOCAL:
                    source = "🟡 LOCAL FILE";
                    break;
            }

            Log.d("Glide", source + " | " + url);
            return false;
        }

        @Override
        public boolean onLoadFailed(
                @Nullable GlideException e,
                Object model,
                Target<Drawable> target,
                boolean isFirstResource) {
            Log.e("Glide", "Failed: " + url, e);
            return false;
        }
    })
    .into(imageView);
```

---

### 8.2. Measure Load Time

```java
private void loadProductImage(Product product) {
    final long startTime = System.currentTimeMillis();

    Glide.with(itemView.getContext())
        .load(optimizedUrl)
        .listener(new RequestListener<Drawable>() {
            @Override
            public boolean onResourceReady(
                    Drawable resource,
                    Object model,
                    Target<Drawable> target,
                    DataSource dataSource,
                    boolean isFirstResource) {

                // Tính thời gian load
                long loadTime = System.currentTimeMillis() - startTime;

                Log.d("Performance",
                    "Load time: " + loadTime + "ms | " +
                    "Source: " + dataSource);

                return false;
            }

            @Override
            public boolean onLoadFailed(...) {
                long loadTime = System.currentTimeMillis() - startTime;
                Log.e("Performance", "Failed after " + loadTime + "ms");
                return false;
            }
        })
        .into(ivProductImage);
}
```

**Typical Load Times**:

- 🟢 Memory cache: 1-5ms
- 🔵 Disk cache: 10-50ms
- 🔴 Network (optimized): 50-200ms
- 🔴 Network (original): 200-1000ms

---

### 8.3. Monitor Cache Hit Rate

```java
public class CacheMonitor {
    private int memoryHits = 0;
    private int diskHits = 0;
    private int networkHits = 0;

    public void recordHit(DataSource dataSource) {
        switch (dataSource) {
            case MEMORY_CACHE:
                memoryHits++;
                break;
            case DATA_DISK_CACHE:
            case RESOURCE_DISK_CACHE:
                diskHits++;
                break;
            case REMOTE:
                networkHits++;
                break;
        }
    }

    public void printStats() {
        int total = memoryHits + diskHits + networkHits;

        Log.d("CacheStats", "Total requests: " + total);
        Log.d("CacheStats", "Memory hits: " + memoryHits +
            " (" + (memoryHits * 100 / total) + "%)");
        Log.d("CacheStats", "Disk hits: " + diskHits +
            " (" + (diskHits * 100 / total) + "%)");
        Log.d("CacheStats", "Network hits: " + networkHits +
            " (" + (networkHits * 100 / total) + "%)");
    }
}

// Usage
CacheMonitor monitor = new CacheMonitor();

Glide.with(context)
    .load(url)
    .listener(new RequestListener<Drawable>() {
        @Override
        public boolean onResourceReady(...) {
            monitor.recordHit(dataSource);
            return false;
        }
    })
    .into(imageView);

// Print stats sau khi scroll
monitor.printStats();
```

**Good Cache Hit Rate**:

- Memory: 60-80% (scroll qua lại)
- Disk: 15-30% (mở app lại)
- Network: 5-10% (chỉ lần đầu)

---

## 9. Performance Comparison

### 9.1. Không Dùng Glide vs Dùng Glide

```
┌─────────────────────────────────────────────────────────────────┐
│              LOAD 100 IMAGES TRONG RECYCLERVIEW                 │
├─────────────────────────────────────────────────────────────────┤
│  KHÔNG DÙNG GLIDE (Load trực tiếp)                              │
│  ├─ Lần 1 (Network): 100 × 500ms = 50,000ms (50s)              │
│  ├─ Scroll qua lại: 100 × 500ms = 50,000ms (50s) mỗi lần       │
│  ├─ Memory usage: 100 × 2MB = 200MB                            │
│  ├─ UI: Lag, freeze, ANR                                       │
│  └─ Result: ❌ KHÔNG SỬ DỤNG ĐƯỢC                              │
├─────────────────────────────────────────────────────────────────┤
│  DÙNG GLIDE (Với cache)                                         │
│  ├─ Lần 1 (Network): 100 × 50ms = 5,000ms (5s)                 │
│  │   → Optimized URL giảm 90% file size                        │
│  ├─ Scroll qua lại (Memory): 100 × 2ms = 200ms (0.2s)          │
│  │   → Cache hit rate 80%                                       │
│  ├─ Mở app lại (Disk): 100 × 20ms = 2,000ms (2s)               │
│  │   → Không cần download lại                                  │
│  ├─ Memory usage: ~50MB (chỉ cache visible items)              │
│  ├─ UI: Mượt mà, không lag                                     │
│  └─ Result: ✅ HOÀN HẢO                                         │
└─────────────────────────────────────────────────────────────────┘

IMPROVEMENT:
- First load: 10x faster (50s → 5s)
- Scroll: 250x faster (50s → 0.2s)
- Memory: 4x less (200MB → 50MB)
- UX: Từ unusable → perfect
```

---

### 9.2. Original URL vs Optimized URL

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE IMAGE LOAD                            │
├─────────────────────────────────────────────────────────────────┤
│  ORIGINAL URL (2000x2000px, JPEG)                              │
│  ├─ File size: 500KB                                           │
│  ├─ Download time: 500ms (1Mbps network)                       │
│  ├─ Decode time: 100ms                                         │
│  ├─ Memory: 2000×2000×4 bytes = 16MB                           │
│  └─ Total: 600ms                                               │
├─────────────────────────────────────────────────────────────────┤
│  OPTIMIZED URL (400x400px, WebP)                               │
│  ├─ File size: 50KB (giảm 90%)                                 │
│  ├─ Download time: 50ms (giảm 10x)                             │
│  ├─ Decode time: 20ms (giảm 5x)                                │
│  ├─ Memory: 400×400×4 bytes = 640KB (giảm 25x)                 │
│  └─ Total: 70ms (giảm 8.5x)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Common Issues & Solutions

### 10.1. Ảnh Hiển Thị Sai Khi Scroll

**Vấn đề**:

```java
// Scroll nhanh → Ảnh hiển thị sai
// Item #5 hiển thị ảnh của Item #1
```

**Nguyên nhân**:

- ViewHolder được recycle
- Request cũ chưa complete
- Request mới đã bắt đầu
- Request cũ complete sau → Hiển thị ảnh sai

**Giải pháp**:

```java
// ✅ Clear image trước khi load mới
public void bind(Product product) {
    Glide.with(itemView.getContext()).clear(ivProductImage);

    Glide.with(itemView.getContext())
        .load(product.getImage())
        .into(ivProductImage);
}
```

---

### 10.2. Out Of Memory (OOM)

**Vấn đề**:

```
java.lang.OutOfMemoryError: Failed to allocate a XXX byte allocation
```

**Nguyên nhân**:

- Load ảnh quá lớn
- Không optimize URL
- Cache quá nhiều

**Giải pháp**:

```java
// 1. Optimize URL
String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(url, 400);

// 2. Override size
Glide.with(context)
    .load(url)
    .override(400, 400)
    .into(imageView);

// 3. Giảm cache size (trong AppGlideModule)
@Override
public void applyOptions(Context context, GlideBuilder builder) {
    builder.setMemoryCache(new LruResourceCache(50 * 1024 * 1024)); // 50MB
}
```

---

### 10.3. Ảnh Load Chậm

**Vấn đề**:

```
Ảnh mất 2-3 giây mới hiển thị
```

**Nguyên nhân**:

- Network chậm
- Ảnh quá lớn
- Không cache

**Giải pháp**:

```java
// 1. Optimize URL (quan trọng nhất!)
String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(url, 400);

// 2. Enable cache
.diskCacheStrategy(DiskCacheStrategy.ALL)

// 3. Preload
Glide.with(context).load(url).preload();

// 4. Thumbnail
Glide.with(context)
    .load(highResUrl)
    .thumbnail(0.1f) // Load 10% size trước
    .into(imageView);
```

---

### 10.4. Placeholder Không Hiển Thị

**Vấn đề**:

```
Placeholder không hiển thị, ImageView trống
```

**Nguyên nhân**:

- Placeholder resource không tồn tại
- ImageView có background

**Giải pháp**:

```java
// 1. Dùng color thay vì drawable
.placeholder(R.color.placeholder_gray)

// 2. Hoặc tạo drawable
.placeholder(new ColorDrawable(Color.GRAY))

// 3. Set background cho ImageView
ivProductImage.setBackgroundColor(0xFFE0E0E0);
```

---

## 11. Advanced Techniques

### 11.1. Custom Transformations

```java
// Rounded corners
Glide.with(context)
    .load(url)
    .transform(new RoundedCorners(16))
    .into(imageView);

// Multiple transformations
Glide.with(context)
    .load(url)
    .transform(new MultiTransformation<>(
        new CenterCrop(),
        new RoundedCorners(16)
    ))
    .into(imageView);

// Blur
Glide.with(context)
    .load(url)
    .transform(new BlurTransformation(25))
    .into(imageView);
```

---

### 11.2. Thumbnail Strategy

```java
// Load thumbnail trước, sau đó load full size
Glide.with(context)
    .load(highResUrl)
    .thumbnail(
        Glide.with(context)
            .load(thumbnailUrl)
    )
    .into(imageView);

// Hoặc load % size trước
Glide.with(context)
    .load(url)
    .thumbnail(0.1f) // Load 10% size trước
    .into(imageView);
```

---

### 11.3. Crossfade Animation

```java
// Smooth transition khi ảnh load xong
Glide.with(context)
    .load(url)
    .transition(DrawableTransitionOptions.withCrossFade())
    .into(imageView);

// Custom duration
Glide.with(context)
    .load(url)
    .transition(DrawableTransitionOptions.withCrossFade(300)) // 300ms
    .into(imageView);
```

---

## 12. Tổng Kết

### Key Takeaways:

1. **Glide Architecture**:

   - Memory cache → Disk cache → Network
   - 3-level caching cho performance tối ưu
   - Lifecycle aware → Tự động cleanup

2. **RecyclerView Integration**:

   - Clear image trước khi load mới
   - Optimize URL với Cloudinary
   - Reuse RequestOptions
   - Monitor cache hit rate

3. **Optimization Strategies**:

   - DiskCacheStrategy.ALL
   - Cloudinary transformations (w\_, c_limit, f_auto, q_auto)
   - Preload images
   - Thumbnail strategy

4. **Performance**:
   - Memory cache: ~2ms
   - Disk cache: ~20ms
   - Network (optimized): ~50ms
   - Network (original): ~500ms

### Best Practices Checklist:

- ✅ Clear image trong bind()
- ✅ Optimize URL trước khi load
- ✅ Sử dụng DiskCacheStrategy.ALL
- ✅ Set placeholder và error
- ✅ Use centerCrop() cho product images
- ✅ Monitor cache hit rate
- ✅ Log load time và source
- ✅ Handle lifecycle đúng cách

### Công Thức Thành Công:

```
Glide + Cloudinary + Caching = Fast + Smooth + Efficient
```

---

## 13. References

**Related Files**:

- `ProductViewHolder.java`: Glide implementation
- `CloudinaryUrlUtil.java`: URL optimization
- `ProductAdapter.java`: RecyclerView integration

**Documentation**:

- [Glide Documentation](https://bumptech.github.io/glide/)
- [Cloudinary Transformations](https://cloudinary.com/documentation/image_transformations)
- [Android Image Loading Best Practices](https://developer.android.com/topic/performance/graphics)

**Libraries**:

- Glide: `com.github.bumptech.glide:glide:4.16.0`
- Cloudinary: URL transformations
