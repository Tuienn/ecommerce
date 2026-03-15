# Android XML & Performance Optimization Demo

Dự án demo các kỹ thuật tối ưu hóa UI/UX và Performance cho màn hình **Danh sách sản phẩm (Product List)**, tập trung vào XML Layout, xử lý hình ảnh và Networking.

## 🚀 Các Kỹ Thuật Tối Ưu

### 1. ConstraintLayout (Flatten Hierarchy)

Sử dụng `ConstraintLayout` để làm phẳng view hierarchy, tránh lồng nhau (nested layouts) giúp cải thiện hiệu năng measure/layout pass, đặc biệt quan trọng cho các item trong RecyclerView.

**Code:** `res/layout/activity_product_list.xml`

```xml
<androidx.constraintlayout.widget.ConstraintLayout ...>
    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rvProducts"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:visibility="gone"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintTop_toTopOf="parent" ... />

    <ViewStub ... />
</androidx.constraintlayout.widget.ConstraintLayout>
```

### 2. Layout Merge & Include (Giảm Nesting)

Sử dụng thẻ `<merge>` trong layout item của RecyclerView để loại bỏ view group dư thừa khi inflate vào parent (thường là `CardView` được tạo trong Adapter).

**Code:** `res/layout/item_product.xml`

```xml
<merge xmlns:android="http://schemas.android.com/apk/res/android"
    tools:parentTag="androidx.cardview.widget.CardView">

    <androidx.constraintlayout.widget.ConstraintLayout ...>
        <!-- Product Content -->
    </androidx.constraintlayout.widget.ConstraintLayout>
</merge>
```

### 3. Tối Ưu Overdraw (GPU Rendering)

Loại bỏ background không cần thiết (`@null`) để giảm số lần GPU phải vẽ lại cùng một pixel. Chỉ giữ lại background ở nơi thực sự cần thiết (ví dụ: CardView container, Image placeholder).

**Code:** `res/layout/item_product.xml`

```xml
<androidx.constraintlayout.widget.ConstraintLayout
    android:background="@null" ...>

    <TextView
        android:id="@+id/tvProductName"
        android:background="@null" ... />

    <TextView
        android:id="@+id/tvPrice"
        android:background="@null" ... />
</androidx.constraintlayout.widget.ConstraintLayout>
```

### 4. Lazy Loading với ViewStub

Sử dụng `ViewStub` cho các trạng thái không hiển thị ngay lập tức (Loading, Empty, Error). View chỉ được inflate vào bộ nhớ khi thực sự cần hiển thị, giảm thời gian khởi tạo màn hình ban đầu.

**Code:** `res/layout/activity_product_list.xml`

```xml
<!-- Loading State -->
<ViewStub
    android:id="@+id/viewStubLoading"
    android:layout="@layout/layout_loading" ... />

<!-- Empty State -->
<ViewStub
    android:id="@+id/viewStubEmpty"
    android:layout="@layout/layout_empty" ... />

<!-- Error State -->
<ViewStub
    android:id="@+id/viewStubError"
    android:layout="@layout/layout_error" ... />
```

### 5. Cloudinary Image Optimization (WebP & Resizing)

Tối ưu hóa URL hình ảnh từ Cloudinary để giảm dung lượng tải về mà vẫn giữ chất lượng hiển thị.

- `w_width`: Resize ảnh về kích thước hiển thị (không tải ảnh full-size).
- `f_auto`: Tự động chọn định dạng tối ưu (WebP, AVIF) tùy theo browser/device hỗ trợ.
- `q_auto`: Tự động cân chỉnh chất lượng nén.
- `c_limit`: Resize nhưng không scale up nếu ảnh gốc nhỏ hơn.

**Code:** `utils/CloudinaryUrlUtil.java`

```java
public static String optimizeToWebp(String originalUrl, int width) {
    // Transform: w_400,c_limit,f_auto,q_auto
    String transform = "w_" + width + ",c_limit,f_auto,q_auto";
    String[] parts = originalUrl.split("/upload/", 2);

    return parts[0] + "/upload/" + transform + "/" + parts[1];
}
```

### 6. Network Optimization & Debugging (OkHttp)

Cấu hình `OkHttpClient` để tối ưu kết nối mạng và hỗ trợ debug hiệu năng API.

- **Timeouts:** Cấu hình `connectTimeout`, `readTimeout`, `writeTimeout` hợp lý để tránh treo ứng dụng khi mạng kém.
- **Logging Interceptor:** Log chi tiết request/response bao gồm thời gian phản hồi (`duration`) và kích thước body để monitor performance.
- **Singleton Pattern:** Sử dụng một instance `ApiClient` duy nhất để tận dụng connection pooling của OkHttp.

**Code:** `productlist/network/ApiClient.java`

```java
okHttpClient = new OkHttpClient.Builder()
    .connectTimeout(Constants.CONNECT_TIMEOUT, TimeUnit.SECONDS)
    .addInterceptor(chain -> {
        long startTime = System.currentTimeMillis();
        Response response = chain.proceed(chain.request());
        long endTime = System.currentTimeMillis();

        // Log response time & size
        logResponse(response, endTime - startTime);
        return response;
    })
    .build();
```

### 7. Lazy Loading Pagination (Infinite Scroll)

Tải dữ liệu theo trang (chunks) khi người dùng cuộn xuống gần cuối danh sách, giảm tải bộ nhớ và network request cho lượng dữ liệu lớn.

- **PaginationScrollListener:** Lắng nghe sự kiện scroll của RecyclerView để phát hiện khi người dùng cuộn đến cuối danh sách.
- **Loading Footer:** Hiển thị item loading ở cuối danh sách khi đang tải trang tiếp theo.

**Code:** `ProductListActivity.java`

```java
rvProducts.addOnScrollListener(new PaginationScrollListener(layoutManager) {
    @Override
    protected void loadMoreItems() {
        isLoading = true;
        currentPage++;
        loadNextPage();
    }

    @Override
    public boolean isLastPage() { return isLastPage; }

    @Override
    public boolean isLoading() { return isLoading; }
});
```

### 8. RecyclerView & ViewHolder (ConstraintLayout for CardView)

Tối ưu hóa việc khởi tạo View và Layout hierarchy trong RecyclerView Adapter để đạt hiệu năng cao nhất.

- **Programmatic CardView Creation:** Tạo `CardView` bằng Java code trong Adapter thay vì XML để kiểm soát tốt hơn các thuộc tính layout params và margin.
- **Merge Tag Integration:** Layout `item_product.xml` sử dụng thẻ `<merge>` bao bọc `ConstraintLayout`. Khi inflate vào `CardView`, hệ thống sẽ gắn trực tiếp `ConstraintLayout` vào `CardView`, đảm bảo hierarchy phẳng (CardView -> ConstraintLayout) mà không sinh ra view trung gian thừa.
- **ViewHolder Pattern:** Cache toàn bộ view references trong `ProductViewHolder` ngay khi khởi tạo để loại bỏ chi phí `findViewById` khi cuộn.

**Code:** `ProductAdapter.java`

```java
@Override
public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
    // 1. Create CardView container programmatically
    CardView cardView = new CardView(parent.getContext());
    // ... set params ...

    // 2. Inflate content (ConstraintLayout wrapped in merge) into CardView
    LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_product, cardView, true);

    return new ProductViewHolder(cardView);
}
```

**Code:** `ProductViewHolder.java`

```java
public class ProductViewHolder extends RecyclerView.ViewHolder {
    // Cache Views to avoid findViewById during scrolling
    private final TextView tvName;
    private final TextView tvPrice;
    private final ImageView ivImage;

    public ProductViewHolder(@NonNull View itemView) {
        super(itemView);
        tvName = itemView.findViewById(R.id.tvProductName);
        tvPrice = itemView.findViewById(R.id.tvPrice);
        ivImage = itemView.findViewById(R.id.ivProductImage);
    }
}
```

### 9. Image Loading Optimization (Glide)

Sử dụng thư viện Glide kết hợp với Cloudinary để tối ưu hóa việc tải và hiển thị ảnh.

- **Glide Caching:** `DiskCacheStrategy.ALL` giúp cache cả ảnh gốc và ảnh đã resize, giảm tải mạng cho các lần hiển thị sau.
- **Cloudinary Integration:** URL ảnh được xử lý qua `CloudinaryUrlUtil` để request định dạng WebP và kích thước phù hợp trước khi đưa cho Glide.

**Code:** `ProductViewHolder.java`

```java
public void bind(Product product) {
    // 1. Optimize URL: WebP format, resized to 400px width
    String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(product.getImage(), 400);

    // 2. Load with Glide
    Glide.with(itemView.getContext())
        .load(optimizedUrl)
        .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache original & resized
        .placeholder(R.color.placeholder_gray)
        .into(ivImage);
}
```

### 10. Lợi Ích Tổng Hợp

| Kỹ Thuật                     | Lợi Ích                                           |
| :--------------------------- | :------------------------------------------------ |
| **ConstraintLayout & Merge** | Tăng tốc độ render UI, giảm memory overhead.      |
| **ViewStub**                 | Giảm thời gian khởi động Activity, tiết kiệm RAM. |
| **Cloudinary (WebP)**        | Giảm ~85% dung lượng ảnh, load nhanh hơn ~60%.    |
| **OkHttp Config**            | Quản lý kết nối tốt hơn, dễ dàng debug latency.   |
| **Overdraw Removal**         | Giảm tải cho GPU, tăng FPS khi cuộn danh sách.    |
| **Pagination**               | Giảm thời gian load ban đầu, tiết kiệm bandwidth. |
| **ViewHolder Optimization**  | Loại bỏ overhead khi binding data, tăng độ mượt.  |
