# Android XML & Performance Optimization Demo

Dự án demo các kỹ thuật tối ưu hóa UI/UX và Performance cho Android, tập trung vào XML Layout và xử lý dữ liệu.

## 🚀 Các Kỹ Thuật Tối Ưu

### 1. ConstraintLayout (Flatten Hierarchy)

Sử dụng `ConstraintLayout` để làm phẳng view hierarchy, tránh lồng nhau (nested layouts) giúp cải thiện hiệu năng measure/layout pass.

**Code:** `res/layout/activity_product_list.xml`

```xml
<androidx.constraintlayout.widget.ConstraintLayout ...>
    <androidx.recyclerview.widget.RecyclerView ... />
    <ViewStub ... />
</androidx.constraintlayout.widget.ConstraintLayout>
```

### 2. Layout Merge & Include (Giảm Nesting)

Sử dụng thẻ `<merge>` trong layout item của RecyclerView để loại bỏ view group dư thừa khi inflate vào parent (CardView).

**Code:** `res/layout/item_product.xml`

```xml
<merge tools:parentTag="androidx.cardview.widget.CardView">
    <androidx.constraintlayout.widget.ConstraintLayout ...>
        <!-- Content -->
    </androidx.constraintlayout.widget.ConstraintLayout>
</merge>
```

### 3. Tối Ưu Overdraw (GPU Rendering)

Loại bỏ background không cần thiết (`@null`) để giảm số lần GPU phải vẽ lại cùng một pixel. Chỉ giữ lại background ở nơi thực sự cần thiết (ví dụ: CardView, Image).

**Code:** `res/layout/item_product.xml`

```xml
<androidx.constraintlayout.widget.ConstraintLayout
    android:background="@null" ...>

    <TextView android:background="@null" ... />
</androidx.constraintlayout.widget.ConstraintLayout>
```

### 4. Lazy Loading với ViewStub

Sử dụng `ViewStub` cho các trạng thái không hiển thị ngay lập tức (Loading, Empty, Error). View chỉ được inflate vào bộ nhớ khi thực sự cần hiển thị.

**Code:** `res/layout/activity_product_list.xml`

```xml
<ViewStub
    android:id="@+id/viewStubLoading"
    android:layout="@layout/layout_loading" ... />
```

### 5. RecyclerView Optimization

- **ViewHolder Pattern:** Cache lại các view references (`findViewById`) trong `ProductViewHolder`.
- **SpanIndexCache:** Bật caching cho `GridLayoutManager` để tránh tính toán lại span size liên tục gây giật lag khi cuộn.

**Code:** `ProductListActivity.java`

```java
// Enable caching to improve scroll performance
spanSizeLookup.setSpanIndexCacheEnabled(true);
layoutManager.setSpanSizeLookup(spanSizeLookup);
```

### 6. Lazy Loading Pagination (Infinite Scroll)

Tải dữ liệu theo trang (chunks) khi người dùng cuộn xuống gần cuối danh sách, giảm tải bộ nhớ và network.

**Code:** `ProductListActivity.java`

```java
rvProducts.addOnScrollListener(new PaginationScrollListener(layoutManager) {
    @Override
    protected void loadMoreItems() {
        loadNextPage(); // Gọi API page tiếp theo
    }
});
```

### 7. Background Threading

Xử lý Network Request trên background thread (sử dụng `ExecutorService`) để không chặn UI Thread (Main Thread), tránh lỗi ANR.

**Code:** `ProductApiService.java`

```java
executorService.execute(() -> {
    // Thực hiện API call nặng ở đây
    // ...
    // Post kết quả về Main Thread để update UI
    mainHandler.post(() -> callback.onSuccess(data));
});
```

### 8. Responsive UI (Bonus)

Tự động thay đổi số cột Grid theo kích thước màn hình (Mobile: 2 cột, Tablet: 3 cột) bằng resource qualifiers.

**Code:** `res/values/dimens.xml` & `res/values-sw600dp/dimens.xml`

```xml
<!-- Mobile -->
<integer name="grid_column_count">2</integer>
<!-- Tablet (sw600dp) -->
<integer name="grid_column_count">3</integer>
```
