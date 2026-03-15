# PaginationScrollListener - Lazy Loading Documentation

## Tổng quan

`PaginationScrollListener` là một abstract class kế thừa từ `RecyclerView.OnScrollListener`, được thiết kế để implement lazy loading (tải dữ liệu theo trang) khi người dùng scroll đến cuối danh sách.

**File**: `PaginationScrollListener.java`

---

## 1. Cấu trúc Class

### Kế thừa và Kiểu

```java
public abstract class PaginationScrollListener extends RecyclerView.OnScrollListener
```

**Giải thích**:

- `abstract class`: Class trừu tượng, không thể khởi tạo trực tiếp
- `extends RecyclerView.OnScrollListener`: Kế thừa từ listener để lắng nghe sự kiện scroll
- Phải được implement trong Activity/Fragment để sử dụng

---

## 2. Khai báo Biến

### 2.1. Instance Variables

```java
private GridLayoutManager layoutManager;
```

**Chi tiết**:

- **Kiểu**: `GridLayoutManager`
- **Access modifier**: `private` - chỉ truy cập trong class
- **Mục đích**: Lưu trữ reference đến LayoutManager của RecyclerView
- **Sử dụng**: Để lấy thông tin về vị trí scroll và số lượng items

**Tại sao cần biến này?**

- Để biết được vị trí item đầu tiên đang hiển thị
- Để biết tổng số items trong RecyclerView
- Để biết số items đang hiển thị trên màn hình

---

## 3. Constructor

### 3.1. Khởi tạo

```java
public PaginationScrollListener(GridLayoutManager layoutManager) {
    this.layoutManager = layoutManager;
}
```

**Tham số**:

- `layoutManager`: GridLayoutManager của RecyclerView

**Logic**:

1. Nhận `layoutManager` từ bên ngoài
2. Gán vào biến instance `this.layoutManager`
3. Biến này sẽ được sử dụng trong method `onScrolled()`

**Ví dụ khởi tạo**:

```java
// Trong Activity/Fragment
GridLayoutManager layoutManager = new GridLayoutManager(this, 2);
rvProducts.setLayoutManager(layoutManager);

// Tạo PaginationScrollListener với layoutManager
PaginationScrollListener paginationListener = new PaginationScrollListener(layoutManager) {
    @Override
    protected void loadMoreItems() {
        // Logic load thêm dữ liệu
    }

    @Override
    public boolean isLastPage() {
        return isLastPage; // biến boolean trong Activity
    }

    @Override
    public boolean isLoading() {
        return isLoading; // biến boolean trong Activity
    }
};

// Gắn listener vào RecyclerView
rvProducts.addOnScrollListener(paginationListener);
```

---

## 4. Method Override: onScrolled()

### 4.1. Signature

```java
@Override
public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
    super.onScrolled(recyclerView, dx, dy);
    // ... logic
}
```

**Tham số**:

- `recyclerView`: RecyclerView đang được scroll
- `dx`: Khoảng cách scroll theo chiều ngang (pixels)
- `dy`: Khoảng cách scroll theo chiều dọc (pixels)

**Annotation**:

- `@Override`: Ghi đè method từ parent class
- `@NonNull`: Đảm bảo recyclerView không null

---

### 4.2. Logic Chi Tiết

#### Bước 1: Lấy thông tin scroll

```java
int visibleItemCount = layoutManager.getChildCount();
int totalItemCount = layoutManager.getItemCount();
int firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition();
```

**Giải thích từng biến**:

1. **`visibleItemCount`** (Số items đang hiển thị):

   ```java
   int visibleItemCount = layoutManager.getChildCount();
   ```

   - Method: `getChildCount()` - Đếm số views con đang được hiển thị
   - Ví dụ: Nếu màn hình đang hiển thị 6 sản phẩm → `visibleItemCount = 6`

2. **`totalItemCount`** (Tổng số items):

   ```java
   int totalItemCount = layoutManager.getItemCount();
   ```

   - Method: `getItemCount()` - Tổng số items trong adapter
   - Ví dụ: Nếu đã load 20 sản phẩm → `totalItemCount = 20`

3. **`firstVisibleItemPosition`** (Vị trí item đầu tiên):
   ```java
   int firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition();
   ```
   - Method: `findFirstVisibleItemPosition()` - Tìm vị trí item đầu tiên đang hiển thị
   - Ví dụ: Nếu đang scroll đến item thứ 15 → `firstVisibleItemPosition = 15`

---

#### Bước 2: Kiểm tra điều kiện load more

```java
if (!isLoading() && !isLastPage()) {
    if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount
            && firstVisibleItemPosition >= 0) {
        loadMoreItems();
    }
}
```

**Phân tích từng điều kiện**:

##### Điều kiện ngoài:

```java
if (!isLoading() && !isLastPage())
```

1. **`!isLoading()`**: Không đang load dữ liệu

   - Tránh load nhiều lần cùng lúc
   - Abstract method, phải implement trong Activity

2. **`!isLastPage()`**: Chưa phải trang cuối
   - Còn dữ liệu để load
   - Abstract method, phải implement trong Activity

##### Điều kiện trong:

```java
if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount
        && firstVisibleItemPosition >= 0)
```

1. **`(visibleItemCount + firstVisibleItemPosition) >= totalItemCount`**:

   **Giải thích bằng ví dụ**:

   ```
   Giả sử:
   - visibleItemCount = 6 (đang hiển thị 6 items)
   - firstVisibleItemPosition = 15 (item đầu tiên là vị trí 15)
   - totalItemCount = 20 (tổng 20 items)

   Tính toán:
   6 + 15 = 21 >= 20 → TRUE → Đã scroll gần hết
   ```

   **Ý nghĩa**: User đã scroll đến gần cuối danh sách

2. **`firstVisibleItemPosition >= 0`**:

   **Giải thích**:

   - `findFirstVisibleItemPosition()` trả về `-1` nếu không tìm thấy item
   - Điều kiện này đảm bảo RecyclerView có items hợp lệ
   - Tránh trường hợp lỗi khi RecyclerView trống

---

#### Bước 3: Trigger load more

```java
loadMoreItems();
```

**Giải thích**:

- Abstract method, phải implement trong Activity
- Được gọi khi tất cả điều kiện thỏa mãn
- Nơi viết logic load trang tiếp theo

---

## 5. Abstract Methods

### 5.1. loadMoreItems()

```java
protected abstract void loadMoreItems();
```

**Chi tiết**:

- **Access**: `protected` - chỉ truy cập trong subclass
- **Return**: `void` - không trả về gì
- **Mục đích**: Load thêm dữ liệu khi scroll đến cuối

**Implementation trong Activity**:

```java
@Override
protected void loadMoreItems() {
    // 1. Set flag đang loading
    isLoading = true;

    // 2. Tăng số trang
    currentPage++;

    // 3. Hiển thị loading footer
    productAdapter.addLoadingFooter();

    // 4. Gọi API load dữ liệu
    loadProducts();
}
```

---

### 5.2. isLastPage()

```java
public abstract boolean isLastPage();
```

**Chi tiết**:

- **Access**: `public` - có thể truy cập từ bên ngoài
- **Return**: `boolean` - true nếu là trang cuối
- **Mục đích**: Kiểm tra còn dữ liệu để load không

**Implementation trong Activity**:

```java
// Khai báo biến trong Activity
private boolean isLastPage = false;

@Override
public boolean isLastPage() {
    return isLastPage;
}

// Cập nhật trong callback API
private void loadProducts() {
    apiService.searchProducts(currentPage, PAGE_SIZE, new ApiCallback<List<Product>>() {
        @Override
        public void onSuccess(List<Product> data) {
            // Nếu số items < PAGE_SIZE → đã hết dữ liệu
            if (data == null || data.size() < PAGE_SIZE) {
                isLastPage = true;
            }
            // ... xử lý data
        }
    });
}
```

---

### 5.3. isLoading()

```java
public abstract boolean isLoading();
```

**Chi tiết**:

- **Access**: `public` - có thể truy cập từ bên ngoài
- **Return**: `boolean` - true nếu đang load
- **Mục đích**: Tránh load nhiều requests cùng lúc

**Implementation trong Activity**:

```java
// Khai báo biến trong Activity
private boolean isLoading = false;

@Override
public boolean isLoading() {
    return isLoading;
}

// Set trong loadNextPage()
private void loadNextPage() {
    isLoading = true; // Bắt đầu load
    currentPage++;
    productAdapter.addLoadingFooter();
    loadProducts();
}

// Reset trong callback
private void loadProducts() {
    apiService.searchProducts(currentPage, PAGE_SIZE, new ApiCallback<List<Product>>() {
        @Override
        public void onSuccess(List<Product> data) {
            productAdapter.removeLoadingFooter();
            isLoading = false; // Kết thúc load
            // ... xử lý data
        }

        @Override
        public void onError(String errorMessage) {
            productAdapter.removeLoadingFooter();
            isLoading = false; // Kết thúc load (có lỗi)
            // ... xử lý error
        }
    });
}
```

---

## 6. Workflow Hoàn Chỉnh

### 6.1. Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Scroll Down                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   onScrolled() triggered    │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Lấy scroll info:            │
        │ - visibleItemCount          │
        │ - totalItemCount            │
        │ - firstVisibleItemPosition  │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Kiểm tra: !isLoading()?     │
        └─────────────┬───────────────┘
                      │
                 ┌────┴────┐
                 │ NO      │ YES
                 ▼         ▼
            ┌────────┐  ┌─────────────────────────┐
            │ Return │  │ Kiểm tra: !isLastPage()?│
            └────────┘  └─────────┬───────────────┘
                                  │
                             ┌────┴────┐
                             │ NO      │ YES
                             ▼         ▼
                        ┌────────┐  ┌──────────────────────────────┐
                        │ Return │  │ Kiểm tra scroll position:    │
                        └────────┘  │ (visible + first) >= total?  │
                                    └─────────┬────────────────────┘
                                              │
                                         ┌────┴────┐
                                         │ NO      │ YES
                                         ▼         ▼
                                    ┌────────┐  ┌──────────────────┐
                                    │ Return │  │ loadMoreItems()  │
                                    └────────┘  └────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌──────────────────┐
                                                │ Set isLoading =  │
                                                │ true             │
                                                └────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌──────────────────┐
                                                │ currentPage++    │
                                                └────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌──────────────────┐
                                                │ Show loading     │
                                                │ footer           │
                                                └────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌──────────────────┐
                                                │ Call API         │
                                                └────────┬─────────┘
                                                          │
                                    ┌─────────────────────┴─────────────────────┐
                                    │                                           │
                                    ▼                                           ▼
                          ┌──────────────────┐                        ┌──────────────────┐
                          │ onSuccess()      │                        │ onError()        │
                          └────────┬─────────┘                        └────────┬─────────┘
                                   │                                           │
                                   ▼                                           ▼
                          ┌──────────────────┐                        ┌──────────────────┐
                          │ Remove loading   │                        │ Remove loading   │
                          │ footer           │                        │ footer           │
                          └────────┬─────────┘                        └────────┬─────────┘
                                   │                                           │
                                   ▼                                           ▼
                          ┌──────────────────┐                        ┌──────────────────┐
                          │ isLoading = false│                        │ isLoading = false│
                          └────────┬─────────┘                        └────────┬─────────┘
                                   │                                           │
                                   ▼                                           ▼
                          ┌──────────────────┐                        ┌──────────────────┐
                          │ Check if last    │                        │ currentPage--    │
                          │ page             │                        │ (rollback)       │
                          └────────┬─────────┘                        └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Add data to      │
                          │ adapter          │
                          └──────────────────┘
```

---

### 6.2. Code Example Hoàn Chỉnh

```java
public class ProductListActivity extends AppCompatActivity {

    // ========== BƯỚC 1: KHAI BÁO BIẾN ==========

    // RecyclerView và Adapter
    private RecyclerView rvProducts;
    private ProductAdapter productAdapter;
    private List<Product> productList;
    private GridLayoutManager layoutManager;

    // Pagination state
    private int currentPage = 1;              // Trang hiện tại
    private boolean isLoading = false;        // Đang load?
    private boolean isLastPage = false;       // Trang cuối?
    private static final int PAGE_SIZE = 10;  // Số items mỗi trang

    // API service
    private ProductApiService apiService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_list);

        // ========== BƯỚC 2: KHỞI TẠO VIEWS ==========

        rvProducts = findViewById(R.id.rvProducts);

        // ========== BƯỚC 3: SETUP LAYOUTMANAGER ==========

        int columnCount = 2; // 2 cột cho mobile
        layoutManager = new GridLayoutManager(this, columnCount);
        rvProducts.setLayoutManager(layoutManager);

        // ========== BƯỚC 4: SETUP ADAPTER ==========

        productList = new ArrayList<>();
        productAdapter = new ProductAdapter(productList);
        rvProducts.setAdapter(productAdapter);

        // ========== BƯỚC 5: THÊM PAGINATIONSCROLLLISTENER ==========

        rvProducts.addOnScrollListener(new PaginationScrollListener(layoutManager) {
            @Override
            protected void loadMoreItems() {
                // Được gọi khi scroll đến cuối
                loadNextPage();
            }

            @Override
            public boolean isLastPage() {
                // Trả về state trang cuối
                return isLastPage;
            }

            @Override
            public boolean isLoading() {
                // Trả về state đang load
                return isLoading;
            }
        });

        // ========== BƯỚC 6: KHỞI TẠO API SERVICE ==========

        apiService = new ProductApiService();

        // ========== BƯỚC 7: LOAD TRANG ĐẦU TIÊN ==========

        loadFirstPage();
    }

    // ========== BƯỚC 8: IMPLEMENT LOAD FIRST PAGE ==========

    private void loadFirstPage() {
        // Reset state
        currentPage = 1;
        isLastPage = false;

        // Clear data cũ
        productAdapter.clear();

        // Load dữ liệu
        loadProducts();
    }

    // ========== BƯỚC 9: IMPLEMENT LOAD NEXT PAGE ==========

    private void loadNextPage() {
        // Set flag đang loading
        isLoading = true;

        // Tăng số trang
        currentPage++;

        // Hiển thị loading footer
        productAdapter.addLoadingFooter();

        // Load dữ liệu
        loadProducts();
    }

    // ========== BƯỚC 10: IMPLEMENT LOAD PRODUCTS ==========

    private void loadProducts() {
        // Gọi API với pagination
        apiService.searchProducts(currentPage, PAGE_SIZE, new ApiCallback<List<Product>>() {
            @Override
            public void onSuccess(List<Product> data) {
                // Remove loading footer
                productAdapter.removeLoadingFooter();

                // Reset loading flag
                isLoading = false;

                // Kiểm tra trang cuối
                if (data == null || data.size() < PAGE_SIZE) {
                    isLastPage = true;
                }

                // Thêm dữ liệu vào adapter
                if (data != null && !data.isEmpty()) {
                    if (currentPage == 1) {
                        // Trang đầu: replace all
                        productList.clear();
                        productList.addAll(data);
                        productAdapter.notifyDataSetChanged();
                    } else {
                        // Trang tiếp theo: append
                        productAdapter.addAll(data);
                    }
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Remove loading footer
                productAdapter.removeLoadingFooter();

                // Reset loading flag
                isLoading = false;

                // Rollback page nếu không phải trang đầu
                if (currentPage > 1) {
                    currentPage--;
                }

                // Show error message
                Toast.makeText(ProductListActivity.this,
                    errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
```

---

## 7. Adapter Methods

### 7.1. addLoadingFooter()

```java
public void addLoadingFooter() {
    if (!isLoadingAdded) {
        isLoadingAdded = true;
        productList.add(null);  // Thêm null item
        notifyItemInserted(productList.size() - 1);
    }
}
```

**Logic**:

1. Kiểm tra chưa thêm loading footer
2. Set flag `isLoadingAdded = true`
3. Thêm `null` vào cuối list (đại diện cho loading item)
4. Notify adapter có item mới ở vị trí cuối

**Tại sao thêm null?**

- Adapter sẽ check `getItemViewType()` dựa vào null
- Nếu item là null → hiển thị loading view
- Nếu item không null → hiển thị product view

---

### 7.2. removeLoadingFooter()

```java
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
```

**Logic**:

1. Kiểm tra đã thêm loading footer
2. Reset flag `isLoadingAdded = false`
3. Lấy item cuối cùng
4. Nếu item là null → xóa khỏi list
5. Notify adapter item đã bị xóa

---

### 7.3. getItemViewType()

```java
@Override
public int getItemViewType(int position) {
    return (position == productList.size() - 1 && isLoadingAdded)
        ? VIEW_TYPE_LOADING
        : VIEW_TYPE_PRODUCT;
}
```

**Logic**:

- Nếu `position` là vị trí cuối cùng VÀ `isLoadingAdded = true`
  → Return `VIEW_TYPE_LOADING` (hiển thị loading view)
- Ngược lại → Return `VIEW_TYPE_PRODUCT` (hiển thị product view)

---

## 8. Best Practices

### 8.1. Khai báo biến đúng scope

```java
// ✅ GOOD - Biến instance (class level)
public class ProductListActivity extends AppCompatActivity {
    private int currentPage = 1;        // Dùng cho toàn bộ Activity
    private boolean isLoading = false;
    private boolean isLastPage = false;
}

// ❌ BAD - Biến local (method level)
private void loadProducts() {
    int currentPage = 1;  // Sẽ bị reset mỗi lần gọi method
}
```

---

### 8.2. Reset state khi reload

```java
private void loadFirstPage() {
    // ✅ GOOD - Reset tất cả state
    currentPage = 1;
    isLastPage = false;
    isLoading = false;  // Quan trọng!

    productAdapter.clear();
    loadProducts();
}
```

---

### 8.3. Xử lý error đúng cách

```java
@Override
public void onError(String errorMessage) {
    // ✅ GOOD - Rollback state
    productAdapter.removeLoadingFooter();
    isLoading = false;

    if (currentPage > 1) {
        currentPage--;  // Rollback page number
    }

    // Show error
    Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show();
}
```

---

### 8.4. Kiểm tra last page

```java
@Override
public void onSuccess(List<Product> data) {
    // ✅ GOOD - Check both null and size
    if (data == null || data.size() < PAGE_SIZE) {
        isLastPage = true;
    }

    // ❌ BAD - Chỉ check null
    if (data == null) {
        isLastPage = true;
    }
    // Nếu data.size() < PAGE_SIZE vẫn load tiếp → lãng phí
}
```

---

## 9. Common Issues & Solutions

### 9.1. Load nhiều lần cùng lúc

**Vấn đề**:

```java
// Scroll nhanh → loadMoreItems() gọi nhiều lần
```

**Giải pháp**:

```java
@Override
protected void loadMoreItems() {
    // ✅ Check trước khi load
    if (isLoading || isLastPage) {
        return;
    }

    isLoading = true;
    // ... load data
}
```

---

### 9.2. Loading footer không biến mất

**Vấn đề**:

```java
// Loading footer vẫn hiển thị sau khi load xong
```

**Giải pháp**:

```java
@Override
public void onSuccess(List<Product> data) {
    // ✅ ALWAYS remove loading footer first
    productAdapter.removeLoadingFooter();
    isLoading = false;

    // ... xử lý data
}

@Override
public void onError(String errorMessage) {
    // ✅ ALWAYS remove loading footer in error too
    productAdapter.removeLoadingFooter();
    isLoading = false;

    // ... xử lý error
}
```

---

### 9.3. firstVisibleItemPosition = -1

**Vấn đề**:

```java
// RecyclerView trống → findFirstVisibleItemPosition() = -1
```

**Giải pháp**:

```java
// ✅ Đã có trong code
if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount
        && firstVisibleItemPosition >= 0) {  // Check >= 0
    loadMoreItems();
}
```

---

## 10. Testing Checklist

### Các trường hợp cần test:

- [ ] Scroll bình thường → load thêm dữ liệu
- [ ] Scroll nhanh → không load nhiều lần
- [ ] Trang cuối → không load nữa
- [ ] Error xảy ra → rollback state đúng
- [ ] Reload → reset state đúng
- [ ] RecyclerView trống → không crash
- [ ] Rotate màn hình → giữ state (cần thêm code)
- [ ] Network chậm → loading footer hiển thị

---

## 11. Tổng kết

### Key Points:

1. **PaginationScrollListener** là abstract class, phải implement 3 methods:

   - `loadMoreItems()`: Logic load thêm dữ liệu
   - `isLastPage()`: Check còn dữ liệu không
   - `isLoading()`: Check đang load không

2. **Biến quan trọng**:

   - `currentPage`: Trang hiện tại
   - `isLoading`: Flag đang load
   - `isLastPage`: Flag trang cuối
   - `layoutManager`: Để lấy scroll info

3. **Flow chính**:

   - User scroll → `onScrolled()` triggered
   - Check điều kiện → gọi `loadMoreItems()`
   - Set `isLoading = true` → load data
   - Success → add data, reset `isLoading`
   - Error → rollback state, reset `isLoading`

4. **Best practices**:
   - Always reset state khi reload
   - Always remove loading footer (success & error)
   - Check both null and size cho last page
   - Rollback page number khi error

---

## 12. References

**Related Files**:

- `ProductListActivity.java`: Implementation example
- `ProductAdapter.java`: Adapter với loading footer
- `StateManager.java`: Quản lý UI states

**Key Concepts**:

- RecyclerView pagination
- Lazy loading
- Abstract class implementation
- Scroll listener
