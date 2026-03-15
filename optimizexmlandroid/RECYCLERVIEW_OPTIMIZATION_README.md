# RecyclerView - Cơ Chế Tối Ưu Render

## Tổng quan

RecyclerView là component mạnh mẽ của Android được thiết kế để hiển thị danh sách dữ liệu lớn một cách **hiệu quả** bằng cách **tái sử dụng (recycle)** các View thay vì tạo mới liên tục.

**Vấn đề với ListView cũ**:

```
1000 items × Tạo 1000 Views = Tốn RAM, chậm, lag
```

**Giải pháp của RecyclerView**:

```
1000 items × Chỉ tạo ~10 Views (số views hiển thị trên màn hình) = Tiết kiệm RAM, nhanh
```

---

## 1. Kiến Trúc RecyclerView

### 1.1. Các Thành Phần Chính

```
┌─────────────────────────────────────────────────────────────┐
│                     RecyclerView                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              LayoutManager                            │  │
│  │  (Quản lý cách bố trí items: Grid, Linear, etc)      │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Adapter                             │  │
│  │  (Cầu nối giữa Data và Views)                         │  │
│  │  - onCreateViewHolder() → Tạo ViewHolder             │  │
│  │  - onBindViewHolder() → Bind data vào ViewHolder     │  │
│  │  - getItemCount() → Số lượng items                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 ViewHolder                            │  │
│  │  (Giữ references đến các Views trong item layout)    │  │
│  │  - findViewById() chỉ gọi 1 lần khi tạo             │  │
│  │  - bind() được gọi mỗi khi recycle                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              RecyclerView Pool                        │  │
│  │  (Pool chứa các ViewHolder đã được recycle)          │  │
│  │  - Tái sử dụng ViewHolder thay vì tạo mới            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ViewHolder Pattern - Trái Tim Của Tối Ưu

### 2.1. Vấn Đề Trước Khi Có ViewHolder

**ListView cũ (không có ViewHolder)**:

```java
// ❌ BAD - Gọi findViewById() mỗi lần scroll
@Override
public View getView(int position, View convertView, ViewGroup parent) {
    if (convertView == null) {
        convertView = inflater.inflate(R.layout.item_product, parent, false);
    }

    // ❌ findViewById() được gọi MỖI LẦN scroll
    TextView tvName = convertView.findViewById(R.id.tvProductName);
    TextView tvPrice = convertView.findViewById(R.id.tvPrice);
    ImageView ivImage = convertView.findViewById(R.id.ivProductImage);

    // Bind data
    tvName.setText(product.getName());
    tvPrice.setText(product.getPrice());

    return convertView;
}
```

**Vấn đề**:

- `findViewById()` được gọi **MỖI LẦN** scroll
- `findViewById()` phải traverse (duyệt) toàn bộ view hierarchy → **CHẬM**
- Với 1000 items, scroll qua hết = 1000 lần gọi findViewById() cho mỗi view

---

### 2.2. Giải Pháp: ViewHolder Pattern

**RecyclerView với ViewHolder**:

```java
// ✅ GOOD - findViewById() chỉ gọi 1 LẦN khi tạo ViewHolder
public class ProductViewHolder extends RecyclerView.ViewHolder {
    // Cache references to views
    private TextView tvProductName;
    private TextView tvPrice;
    private ImageView ivProductImage;

    // Constructor - Chỉ gọi 1 LẦN khi tạo ViewHolder
    public ProductViewHolder(@NonNull View itemView) {
        super(itemView);

        // ✅ findViewById() chỉ gọi 1 LẦN ở đây
        tvProductName = itemView.findViewById(R.id.tvProductName);
        tvPrice = itemView.findViewById(R.id.tvPrice);
        ivProductImage = itemView.findViewById(R.id.ivProductImage);
    }

    // bind() - Được gọi mỗi khi recycle, KHÔNG có findViewById()
    public void bind(Product product) {
        // ✅ Chỉ set data, KHÔNG gọi findViewById()
        tvProductName.setText(product.getName());
        tvPrice.setText(product.getPrice());
        // ... load image
    }
}
```

**Lợi ích**:

- `findViewById()` chỉ gọi **1 LẦN** khi tạo ViewHolder
- Các lần sau chỉ cần **set data** vào views đã cache
- Giảm thiểu view traversal → **NHANH HƠN RẤT NHIỀU**

---

## 3. Cơ Chế Recycle (Tái Sử Dụng View)

### 3.1. Lifecycle của ViewHolder

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECYCLERVIEW LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────┘

BƯỚC 1: Khởi tạo (Lần đầu tiên)
═══════════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────────┐
│  User mở app → RecyclerView cần hiển thị items              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ RecyclerView kiểm tra:         │
        │ "Màn hình có thể hiển thị      │
        │  bao nhiêu items?"             │
        │                                │
        │ Giả sử: 6 items (3 hàng × 2)  │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Gọi onCreateViewHolder()       │
        │ 6 LẦN để tạo 6 ViewHolders     │
        └────────────┬───────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ onCreateViewHolder() - LẦN 1               │
    │ ┌────────────────────────────────────────┐ │
    │ │ 1. Inflate layout (item_product.xml)   │ │
    │ │ 2. Tạo ProductViewHolder               │ │
    │ │ 3. findViewById() tất cả views         │ │
    │ │ 4. Cache views vào ViewHolder          │ │
    │ └────────────────────────────────────────┘ │
    └────────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ onCreateViewHolder() - LẦN 2               │
    │ (Tương tự lần 1)                           │
    └────────────────────────────────────────────┘
                     │
                     ▼
                   ... (4 lần nữa)
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Có 6 ViewHolders trong pool    │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Gọi onBindViewHolder()         │
        │ 6 LẦN để bind data             │
        └────────────┬───────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ onBindViewHolder(holder, position=0)       │
    │ ┌────────────────────────────────────────┐ │
    │ │ holder.bind(productList[0])            │ │
    │ │ → Set data của Product #0 vào views    │ │
    │ └────────────────────────────────────────┘ │
    └────────────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ onBindViewHolder(holder, position=1)       │
    │ → bind(productList[1])                     │
    └────────────────────────────────────────────┘
                     │
                     ▼
                   ... (4 lần nữa)
                     │
                     ▼
        ┌────────────────────────────────┐
        │ 6 items hiển thị trên màn hình │
        │ [Item 0] [Item 1]              │
        │ [Item 2] [Item 3]              │
        │ [Item 4] [Item 5]              │
        └────────────────────────────────┘


BƯỚC 2: User Scroll Down (Recycle Magic!)
═══════════════════════════════════════════════════════════════════
        ┌────────────────────────────────┐
        │ User scroll down               │
        │ Item 0 biến mất khỏi màn hình │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ RecyclerView:                  │
        │ "Item 0 không visible nữa"     │
        │ "Đưa ViewHolder của Item 0     │
        │  vào Recycle Pool"             │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ RECYCLE POOL                   │
        │ ┌────────────────────────────┐ │
        │ │ ViewHolder #0 (available)  │ │
        │ └────────────────────────────┘ │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Item 6 cần hiển thị            │
        │ (scroll vào màn hình)          │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ RecyclerView kiểm tra:         │
        │ "Có ViewHolder trong pool?"    │
        │ → CÓ! (ViewHolder #0)          │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ ❌ KHÔNG gọi                   │
        │    onCreateViewHolder()        │
        │ (Vì đã có ViewHolder sẵn)     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ ✅ CHỈ gọi                     │
        │    onBindViewHolder()          │
        └────────────┬───────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────┐
    │ onBindViewHolder(holder, position=6)       │
    │ ┌────────────────────────────────────────┐ │
    │ │ Lấy ViewHolder #0 từ pool              │ │
    │ │ holder.bind(productList[6])            │ │
    │ │ → Set data của Product #6              │ │
    │ │    vào ViewHolder cũ của Item 0        │ │
    │ └────────────────────────────────────────┘ │
    └────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ ViewHolder #0 giờ hiển thị     │
        │ data của Product #6            │
        │                                │
        │ ✅ KHÔNG tạo View mới          │
        │ ✅ KHÔNG findViewById()        │
        │ ✅ CHỈ set data                │
        └────────────────────────────────┘


BƯỚC 3: Tiếp Tục Scroll (Recycle Liên Tục)
═══════════════════════════════════════════════════════════════════
        ┌────────────────────────────────┐
        │ User scroll tiếp               │
        │ Item 1 biến mất                │
        │ Item 7 cần hiển thị            │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ ViewHolder #1 → Recycle Pool   │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Lấy ViewHolder #1 từ pool      │
        │ onBindViewHolder(holder, 7)    │
        │ → bind(productList[7])         │
        └────────────────────────────────┘
                     │
                     ▼
                   ... (Lặp lại)


TỔNG KẾT:
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────────────┐
│  1000 ITEMS                                                    │
│  ├─ onCreateViewHolder(): Chỉ gọi ~6-10 lần (số views visible)│
│  ├─ onBindViewHolder(): Gọi 1000 lần (mỗi item 1 lần)         │
│  └─ findViewById(): Chỉ gọi ~6-10 lần (trong constructor)     │
│                                                                │
│  ✅ Tiết kiệm RAM: Chỉ 6-10 Views thay vì 1000 Views          │
│  ✅ Nhanh: Không inflate/findViewById mỗi lần scroll          │
│  ✅ Mượt: Không lag khi scroll                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.2. Ví Dụ Cụ Thể Với Code

#### Khi Khởi Tạo (Lần Đầu)

```java
// ===== Activity Setup =====
@Override
protected void onCreate(Bundle savedInstanceState) {
    // 1. Setup RecyclerView
    RecyclerView rvProducts = findViewById(R.id.rvProducts);
    GridLayoutManager layoutManager = new GridLayoutManager(this, 2); // 2 cột
    rvProducts.setLayoutManager(layoutManager);

    // 2. Setup Adapter
    List<Product> productList = new ArrayList<>();
    ProductAdapter adapter = new ProductAdapter(productList);
    rvProducts.setAdapter(adapter);

    // 3. Load data
    loadProducts(); // Load 100 products
}

// ===== RecyclerView Bắt Đầu Hoạt Động =====

// BƯỚC 1: RecyclerView tính toán số views cần thiết
// Màn hình: 1080x1920px
// Mỗi item: ~300px height
// Số hàng visible: 1920 / 300 = ~6 hàng
// Số items visible: 6 hàng × 2 cột = 12 items
// RecyclerView tạo thêm 2-3 items buffer → Tổng: ~15 ViewHolders

// BƯỚC 2: Tạo ViewHolders (onCreateViewHolder gọi 15 lần)

// ===== LẦN 1 =====
@Override
public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
    Log.d("Adapter", "📦 CREATE ViewHolder #1");

    // 1. Tạo CardView
    CardView cardView = new CardView(parent.getContext());
    // ... setup CardView properties

    // 2. Inflate layout vào CardView
    LayoutInflater inflater = LayoutInflater.from(parent.getContext());
    inflater.inflate(R.layout.item_product, cardView, true);

    // 3. Tạo ViewHolder (gọi constructor)
    return new ProductViewHolder(cardView);
    // → Trong constructor:
    //    - findViewById() tất cả views
    //    - Cache vào biến instance
}

// ===== ProductViewHolder Constructor (LẦN 1) =====
public ProductViewHolder(@NonNull View itemView) {
    super(itemView);

    Log.d("ViewHolder", "🔍 findViewById() for ViewHolder #1");

    // findViewById() - CHỈ GỌI 1 LẦN
    tvProductName = itemView.findViewById(R.id.tvProductName);
    tvPrice = itemView.findViewById(R.id.tvPrice);
    tvBasePrice = itemView.findViewById(R.id.tvBasePrice);
    tvDiscountPercent = itemView.findViewById(R.id.tvDiscountPercent);
    tvSoldCount = itemView.findViewById(R.id.tvSoldCount);
    ivProductImage = itemView.findViewById(R.id.ivProductImage);

    // Setup views (chỉ 1 lần)
    tvBasePrice.setPaintFlags(tvBasePrice.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
    priceFormatter = new DecimalFormat("#,###");
}

// ===== LẦN 2-15: Tương tự =====
// onCreateViewHolder() gọi thêm 14 lần
// → Tổng: 15 ViewHolders được tạo

// BƯỚC 3: Bind data (onBindViewHolder gọi 15 lần)

// ===== LẦN 1: Bind Product #0 =====
@Override
public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
    Log.d("Adapter", "🎨 BIND position=" + position);

    if (holder instanceof ProductViewHolder) {
        Product product = productList.get(position); // Product #0
        ((ProductViewHolder) holder).bind(product);
    }
}

// ===== ProductViewHolder.bind() =====
public void bind(Product product) {
    Log.d("ViewHolder", "📝 Binding: " + product.getName());

    // ✅ KHÔNG có findViewById() ở đây!
    // Chỉ set data vào views đã cache

    tvProductName.setText(product.getName());
    tvPrice.setText(priceFormatter.format(product.getPrice()) + "đ");
    tvBasePrice.setText(priceFormatter.format(product.getBasePrice()) + "đ");
    tvDiscountPercent.setText("-" + product.getDiscountPercent() + "%");
    tvSoldCount.setText(formatSoldCount(product.getSoldCount()));

    loadProductImage(product);
}

// ===== LẦN 2-15: Bind Product #1-14 =====
// onBindViewHolder() gọi thêm 14 lần
// → 15 items đầu tiên hiển thị trên màn hình

// ===== KẾT QUẢ SAU KHỞI TẠO =====
// - Có 15 ViewHolders trong memory
// - 12 ViewHolders đang hiển thị (visible)
// - 3 ViewHolders ở buffer (sẵn sàng recycle)
// - Màn hình hiển thị Product #0-11
```

---

#### Khi Scroll (Recycle)

```java
// ===== USER SCROLL DOWN =====

// Item #0 scroll ra khỏi màn hình (top)
// Item #15 scroll vào màn hình (bottom)

// BƯỚC 1: RecyclerView detect Item #0 không visible
Log.d("RecyclerView", "👋 Item #0 not visible anymore");

// BƯỚC 2: Đưa ViewHolder #0 vào Recycle Pool
Log.d("RecyclerView", "♻️  ViewHolder #0 → Recycle Pool");

// BƯỚC 3: Item #15 cần hiển thị
Log.d("RecyclerView", "📥 Item #15 needs to be displayed");

// BƯỚC 4: Kiểm tra Recycle Pool
Log.d("RecyclerView", "🔍 Check Recycle Pool... Found ViewHolder #0!");

// BƯỚC 5: ❌ KHÔNG gọi onCreateViewHolder()
// Vì đã có ViewHolder sẵn trong pool

// BƯỚC 6: ✅ CHỈ gọi onBindViewHolder()
@Override
public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
    // position = 15
    Log.d("Adapter", "♻️  RECYCLE: Reuse ViewHolder for position=" + position);

    if (holder instanceof ProductViewHolder) {
        Product product = productList.get(15); // Product #15
        ((ProductViewHolder) holder).bind(product);
        // → ViewHolder cũ (của Item #0) giờ hiển thị data của Product #15
    }
}

// ===== ProductViewHolder.bind() =====
public void bind(Product product) {
    Log.d("ViewHolder", "♻️  RE-BINDING: " + product.getName());

    // ✅ KHÔNG có findViewById()
    // ✅ KHÔNG inflate layout
    // ✅ CHỈ set data mới vào views cũ

    tvProductName.setText(product.getName()); // Update text
    tvPrice.setText(priceFormatter.format(product.getPrice()) + "đ");
    // ... update các views khác

    // ⚠️ QUAN TRỌNG: Clear image cũ trước khi load image mới
    Glide.with(itemView.getContext()).clear(ivProductImage);
    loadProductImage(product); // Load image mới
}

// ===== KẾT QUẢ =====
// - ViewHolder #0 giờ hiển thị Product #15
// - KHÔNG tạo View mới
// - KHÔNG findViewById()
// - CHỈ update data
// - Rất nhanh! (~1-2ms)

// ===== TIẾP TỤC SCROLL =====
// Item #1 → Recycle Pool
// Item #16 → Reuse ViewHolder #1
// Item #2 → Recycle Pool
// Item #17 → Reuse ViewHolder #2
// ... (Lặp lại)

// ===== SCROLL ĐẾN CUỐI (Item #99) =====
// - Vẫn chỉ có 15 ViewHolders trong memory
// - onCreateViewHolder(): Đã gọi 15 lần (lúc khởi tạo)
// - onBindViewHolder(): Gọi 100 lần (mỗi item 1 lần)
// - findViewById(): Chỉ gọi 15 lần (trong constructor)
```

---

## 4. Chi Tiết Code Implementation

### 4.1. Product Model

```java
public class Product {
    // ===== Khai báo biến =====
    private String name;
    private double basePrice;
    private double price;
    private int discountPercent;
    private int soldCount;
    private String image;

    // ===== Constructor =====
    public Product(String name, double basePrice, double price,
                   int discountPercent, int soldCount, String image) {
        this.name = name;
        this.basePrice = basePrice;
        this.price = price;
        this.discountPercent = discountPercent;
        this.soldCount = soldCount;
        this.image = image;
    }

    // ===== Factory Method: Parse từ JSON =====
    public static Product fromJson(JSONObject json) throws JSONException {
        // Extract data từ JSON
        String name = json.getString("name");
        double basePrice = json.getDouble("basePrice");
        double finalPrice = json.getDouble("price");
        int discountPercent = json.getInt("discountPercent");
        int soldCount = json.getInt("soldCount");

        // Parse images array
        String image = "";
        if (json.has("images")) {
            JSONArray imagesArray = json.getJSONArray("images");
            if (imagesArray.length() > 0) {
                image = imagesArray.getString(0);
            }
        }

        return new Product(name, basePrice, finalPrice, discountPercent, soldCount, image);
    }

    // ===== Getters (để Adapter lấy data) =====
    public String getName() { return name; }
    public double getBasePrice() { return basePrice; }
    public double getPrice() { return price; }
    public int getDiscountPercent() { return discountPercent; }
    public int getSoldCount() { return soldCount; }
    public String getImage() { return image; }
}
```

**Giải thích**:

- **Model**: Đại diện cho 1 Product
- **Factory method**: `fromJson()` để parse từ API response
- **Immutable data**: Chỉ có getters, không có setters (best practice)

---

### 4.2. ProductAdapter

```java
public class ProductAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    // ===== CONSTANTS: View Types =====
    private static final int VIEW_TYPE_PRODUCT = 0;  // Product item
    private static final int VIEW_TYPE_LOADING = 1;  // Loading footer

    // ===== BIẾN INSTANCE =====
    private List<Product> productList;        // Danh sách products
    private boolean isLoadingAdded = false;   // Flag loading footer

    // ===== CONSTRUCTOR =====
    public ProductAdapter(List<Product> productList) {
        this.productList = productList;
    }

    // ===== METHOD 1: onCreateViewHolder() =====
    // Được gọi khi cần TẠO ViewHolder MỚI
    // Chỉ gọi ~10-15 lần (số views visible + buffer)

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        // Kiểm tra view type
        if (viewType == VIEW_TYPE_LOADING) {
            // ===== TẠO LOADING VIEWHOLDER =====
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_loading, parent, false);
            return new LoadingViewHolder(view);

        } else {
            // ===== TẠO PRODUCT VIEWHOLDER =====

            // BƯỚC 1: Tạo CardView (parent container)
            CardView cardView = new CardView(parent.getContext());

            // BƯỚC 2: Set CardView properties
            cardView.setCardElevation(
                parent.getContext().getResources().getDimension(R.dimen.product_card_elevation)
            );
            cardView.setRadius(
                parent.getContext().getResources().getDimension(R.dimen.product_corner_radius)
            );
            cardView.setUseCompatPadding(true);

            // BƯỚC 3: Set layout params
            ViewGroup.MarginLayoutParams layoutParams = new ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            int margin = (int) parent.getContext().getResources()
                .getDimension(R.dimen.spacing_small);
            layoutParams.setMargins(margin, margin, margin, margin);
            cardView.setLayoutParams(layoutParams);

            // BƯỚC 4: Inflate item layout vào CardView
            LayoutInflater inflater = LayoutInflater.from(parent.getContext());
            inflater.inflate(R.layout.item_product, cardView, true);
            // item_product.xml sử dụng <merge> tag nên inflate vào CardView

            // BƯỚC 5: Tạo và return ProductViewHolder
            return new ProductViewHolder(cardView);
            // → Constructor của ProductViewHolder sẽ:
            //    - findViewById() tất cả views
            //    - Cache vào biến instance
        }
    }

    // ===== METHOD 2: onBindViewHolder() =====
    // Được gọi khi cần BIND DATA vào ViewHolder
    // Gọi MỖI LẦN item hiển thị (kể cả recycle)

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof ProductViewHolder) {
            // Lấy product tại vị trí position
            Product product = productList.get(position);

            // Gọi bind() để set data vào views
            ((ProductViewHolder) holder).bind(product);
        }
        // LoadingViewHolder không cần binding (chỉ hiển thị ProgressBar)
    }

    // ===== METHOD 3: getItemCount() =====
    // Trả về tổng số items trong list

    @Override
    public int getItemCount() {
        return productList.size();
    }

    // ===== METHOD 4: getItemViewType() =====
    // Xác định view type cho mỗi position
    // RecyclerView dùng để biết nên tạo ViewHolder nào

    @Override
    public int getItemViewType(int position) {
        // Nếu position là cuối cùng VÀ đã thêm loading footer
        // → Return VIEW_TYPE_LOADING
        // Ngược lại → Return VIEW_TYPE_PRODUCT
        return (position == productList.size() - 1 && isLoadingAdded)
            ? VIEW_TYPE_LOADING
            : VIEW_TYPE_PRODUCT;
    }

    // ===== HELPER METHODS: Pagination =====

    // Thêm loading footer (khi load trang tiếp theo)
    public void addLoadingFooter() {
        if (!isLoadingAdded) {
            isLoadingAdded = true;
            productList.add(null);  // Thêm null item (đại diện loading)
            notifyItemInserted(productList.size() - 1);
        }
    }

    // Xóa loading footer (sau khi load xong)
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

    // Thêm nhiều products (pagination)
    public void addAll(List<Product> newProducts) {
        int startPosition = productList.size();
        productList.addAll(newProducts);
        notifyItemRangeInserted(startPosition, newProducts.size());
    }

    // Clear tất cả products (reload)
    public void clear() {
        productList.clear();
        notifyDataSetChanged();
    }

    // ===== INNER CLASS: LoadingViewHolder =====
    private static class LoadingViewHolder extends RecyclerView.ViewHolder {
        public LoadingViewHolder(@NonNull View itemView) {
            super(itemView);
            // Không cần findViewById() vì layout đơn giản
        }
    }
}
```

**Giải thích các method quan trọng**:

1. **`onCreateViewHolder()`**:

   - Được gọi khi RecyclerView cần **TẠO** ViewHolder mới
   - Chỉ gọi ~10-15 lần (số views visible + buffer)
   - Inflate layout và tạo ViewHolder
   - **EXPENSIVE** (tốn tài nguyên) → Gọi ít nhất có thể

2. **`onBindViewHolder()`**:

   - Được gọi khi RecyclerView cần **BIND DATA** vào ViewHolder
   - Gọi mỗi lần item hiển thị (kể cả recycle)
   - Chỉ set data, KHÔNG inflate layout
   - **CHEAP** (nhẹ) → Có thể gọi nhiều lần

3. **`getItemViewType()`**:
   - Xác định loại view cho mỗi position
   - RecyclerView chỉ recycle ViewHolders cùng type
   - Product ViewHolder không được recycle thành Loading ViewHolder

---

### 4.3. ProductViewHolder

```java
public class ProductViewHolder extends RecyclerView.ViewHolder {

    // ===== BIẾN INSTANCE: Cache Views =====
    // Các biến này giữ references đến views
    // findViewById() chỉ gọi 1 LẦN trong constructor

    private TextView tvProductName;
    private TextView tvPrice;
    private TextView tvBasePrice;
    private TextView tvDiscountPercent;
    private TextView tvSoldCount;
    private ImageView ivProductImage;

    private DecimalFormat priceFormatter;

    // ===== CONSTRUCTOR: findViewById() CHỈ 1 LẦN =====
    // Được gọi từ onCreateViewHolder()
    // Chỉ gọi ~10-15 lần (khi tạo ViewHolder)

    public ProductViewHolder(@NonNull View itemView) {
        super(itemView);

        // ===== BƯỚC 1: findViewById() TẤT CẢ VIEWS =====
        // ⚠️ ĐÂY LÀ NƠI DUY NHẤT GỌI findViewById()

        tvProductName = itemView.findViewById(R.id.tvProductName);
        tvPrice = itemView.findViewById(R.id.tvPrice);
        tvBasePrice = itemView.findViewById(R.id.tvBasePrice);
        tvDiscountPercent = itemView.findViewById(R.id.tvDiscountPercent);
        tvSoldCount = itemView.findViewById(R.id.tvSoldCount);
        ivProductImage = itemView.findViewById(R.id.ivProductImage);

        // ===== BƯỚC 2: SETUP VIEWS (1 LẦN) =====
        // Các setup chỉ cần làm 1 lần, không thay đổi

        // Set strikethrough cho base price
        tvBasePrice.setPaintFlags(
            tvBasePrice.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG
        );

        // Initialize price formatter
        priceFormatter = new DecimalFormat("#,###");
    }

    // ===== METHOD: bind() - SET DATA =====
    // Được gọi từ onBindViewHolder()
    // Gọi MỖI LẦN item hiển thị (kể cả recycle)
    // ✅ KHÔNG có findViewById() ở đây!

    public void bind(Product product) {
        // ===== SET TEXT DATA =====
        // Chỉ update text, KHÔNG findViewById()

        // Product name
        tvProductName.setText(product.getName());

        // Format prices
        String formattedPrice = priceFormatter.format(product.getPrice()) + "đ";
        String formattedBasePrice = priceFormatter.format(product.getBasePrice()) + "đ";

        tvPrice.setText(formattedPrice);
        tvBasePrice.setText(formattedBasePrice);

        // Discount percent
        String discountText = "-" + product.getDiscountPercent() + "%";
        tvDiscountPercent.setText(discountText);

        // Sold count
        String soldCountText = formatSoldCount(product.getSoldCount());
        tvSoldCount.setText(soldCountText);

        // ===== LOAD IMAGE =====
        loadProductImage(product);
    }

    // ===== HELPER METHOD: Load Image =====
    private void loadProductImage(Product product) {
        // ===== BƯỚC 1: CLEAR IMAGE CŨ =====
        // ⚠️ QUAN TRỌNG: Tránh hiển thị image cũ khi recycle

        Glide.with(itemView.getContext())
                .clear(ivProductImage);

        // Reset to placeholder
        ivProductImage.setImageDrawable(null);
        ivProductImage.setBackgroundColor(0xFFE0E0E0);

        // ===== BƯỚC 2: KIỂM TRA IMAGE URL =====
        String imageUrl = product.getImage();
        if (imageUrl == null || imageUrl.isEmpty()) {
            return; // Không có image → giữ placeholder
        }

        // ===== BƯỚC 3: OPTIMIZE IMAGE URL =====
        // Sử dụng Cloudinary để optimize image

        int imageWidth = ivProductImage.getWidth();
        if (imageWidth <= 0) {
            imageWidth = 400; // Default width
        }

        String optimizedUrl = CloudinaryUrlUtil.optimizeToWebp(imageUrl, imageWidth);

        // ===== BƯỚC 4: CONFIGURE GLIDE =====
        RequestOptions options = new RequestOptions()
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache both original & resized
                .placeholder(R.color.placeholder_gray)     // Placeholder while loading
                .error(R.color.placeholder_gray)           // Error placeholder
                .centerCrop();                             // Scale type

        // ===== BƯỚC 5: LOAD IMAGE WITH GLIDE =====
        Glide.with(itemView.getContext())
                .load(optimizedUrl)
                .apply(options)
                .listener(new RequestListener<Drawable>() {
                    @Override
                    public boolean onLoadFailed(@Nullable GlideException e, Object model,
                            Target<Drawable> target, boolean isFirstResource) {
                        Log.e("CacheTest", "❌ FAILED: " + product.getName());
                        return false;
                    }

                    @Override
                    public boolean onResourceReady(Drawable resource, Object model,
                            Target<Drawable> target, DataSource dataSource, boolean isFirstResource) {
                        // Log cache source
                        String source = dataSource == DataSource.MEMORY_CACHE ? "🟢 MEMORY" :
                                        dataSource == DataSource.DATA_DISK_CACHE ||
                                        dataSource == DataSource.RESOURCE_DISK_CACHE ? "🔵 DISK" :
                                        "🔴 NETWORK";
                        Log.d("CacheTest", source + " | " + product.getName());
                        return false;
                    }
                })
                .into(ivProductImage);
    }

    // ===== HELPER METHOD: Format Sold Count =====
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

**Key Points**:

1. **Constructor**:

   - `findViewById()` tất cả views → cache vào biến instance
   - Setup các properties không đổi (strikethrough, formatter)
   - Chỉ gọi 1 LẦN khi tạo ViewHolder

2. **bind() method**:

   - Set data vào views đã cache
   - KHÔNG có findViewById()
   - Gọi mỗi lần item hiển thị (kể cả recycle)

3. **Image loading**:
   - Clear image cũ trước khi load mới (tránh hiển thị sai)
   - Sử dụng Glide với caching
   - Optimize image URL với Cloudinary

---

## 5. Tối Ưu Hóa Nâng Cao

### 5.1. ViewType cho Multiple View Types

```java
// Khi có nhiều loại items khác nhau trong RecyclerView
@Override
public int getItemViewType(int position) {
    Product product = productList.get(position);

    if (product == null) {
        return VIEW_TYPE_LOADING;
    } else if (product.isFeatured()) {
        return VIEW_TYPE_FEATURED;  // Featured product (layout khác)
    } else if (product.isAd()) {
        return VIEW_TYPE_AD;        // Advertisement
    } else {
        return VIEW_TYPE_PRODUCT;   // Normal product
    }
}

@Override
public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
    switch (viewType) {
        case VIEW_TYPE_FEATURED:
            View featuredView = inflater.inflate(R.layout.item_featured, parent, false);
            return new FeaturedViewHolder(featuredView);

        case VIEW_TYPE_AD:
            View adView = inflater.inflate(R.layout.item_ad, parent, false);
            return new AdViewHolder(adView);

        case VIEW_TYPE_LOADING:
            View loadingView = inflater.inflate(R.layout.item_loading, parent, false);
            return new LoadingViewHolder(loadingView);

        default:
            // VIEW_TYPE_PRODUCT
            CardView cardView = new CardView(parent.getContext());
            // ... setup
            return new ProductViewHolder(cardView);
    }
}
```

**Lưu ý**: RecyclerView chỉ recycle ViewHolders **CÙNG TYPE**

- ProductViewHolder không recycle thành FeaturedViewHolder
- Mỗi type có pool riêng

---

### 5.2. DiffUtil - Update Hiệu Quả

```java
// Thay vì notifyDataSetChanged() (update toàn bộ)
// Sử dụng DiffUtil để chỉ update items thay đổi

public class ProductDiffCallback extends DiffUtil.Callback {
    private List<Product> oldList;
    private List<Product> newList;

    public ProductDiffCallback(List<Product> oldList, List<Product> newList) {
        this.oldList = oldList;
        this.newList = newList;
    }

    @Override
    public int getOldListSize() {
        return oldList.size();
    }

    @Override
    public int getNewListSize() {
        return newList.size();
    }

    @Override
    public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
        // So sánh ID
        return oldList.get(oldItemPosition).getId()
                .equals(newList.get(newItemPosition).getId());
    }

    @Override
    public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
        // So sánh nội dung
        Product oldProduct = oldList.get(oldItemPosition);
        Product newProduct = newList.get(newItemPosition);

        return oldProduct.getName().equals(newProduct.getName()) &&
               oldProduct.getPrice() == newProduct.getPrice() &&
               oldProduct.getImage().equals(newProduct.getImage());
    }
}

// Sử dụng trong Adapter
public void updateProducts(List<Product> newProducts) {
    DiffUtil.DiffResult diffResult = DiffUtil.calculateDiff(
        new ProductDiffCallback(this.productList, newProducts)
    );

    this.productList.clear();
    this.productList.addAll(newProducts);

    diffResult.dispatchUpdatesTo(this);
    // → Chỉ update items thay đổi, không update toàn bộ
}
```

**Lợi ích**:

- Chỉ update items thay đổi
- Animations tự động (insert, remove, move)
- Hiệu quả hơn `notifyDataSetChanged()`

---

### 5.3. RecyclerView Pool Tuning

```java
// Tăng pool size cho performance tốt hơn
RecyclerView.RecycledViewPool pool = new RecyclerView.RecycledViewPool();
pool.setMaxRecycledViews(VIEW_TYPE_PRODUCT, 20);  // Tăng từ default (5)
pool.setMaxRecycledViews(VIEW_TYPE_LOADING, 3);

rvProducts.setRecycledViewPool(pool);
```

---

### 5.4. Prefetch (Android 25+)

```java
// Enable prefetch để load items trước khi visible
layoutManager.setItemPrefetchEnabled(true);
layoutManager.setInitialPrefetchItemCount(4); // Prefetch 4 items
```

---

## 6. Performance Comparison

### 6.1. ListView vs RecyclerView

```
┌─────────────────────────────────────────────────────────────┐
│                    1000 ITEMS                               │
├─────────────────────────────────────────────────────────────┤
│  LISTVIEW (Không ViewHolder)                               │
│  ├─ Inflate layout: 1000 lần                               │
│  ├─ findViewById(): 1000 × 6 views = 6000 lần              │
│  ├─ Memory: 1000 Views trong RAM                           │
│  └─ Scroll performance: ❌ LAG                             │
├─────────────────────────────────────────────────────────────┤
│  RECYCLERVIEW (Có ViewHolder)                              │
│  ├─ Inflate layout: ~15 lần                                │
│  ├─ findViewById(): 15 × 6 views = 90 lần                  │
│  ├─ Memory: 15 Views trong RAM                             │
│  └─ Scroll performance: ✅ MƯỢT                            │
└─────────────────────────────────────────────────────────────┘

IMPROVEMENT:
- Inflate: 66x faster (1000 → 15)
- findViewById(): 66x faster (6000 → 90)
- Memory: 66x less (1000 → 15)
```

---

### 6.2. Benchmark

```java
// Đo thời gian onCreateViewHolder()
long startCreate = System.currentTimeMillis();
ViewHolder holder = onCreateViewHolder(parent, viewType);
long createTime = System.currentTimeMillis() - startCreate;
Log.d("Benchmark", "CREATE: " + createTime + "ms"); // ~5-10ms

// Đo thời gian onBindViewHolder()
long startBind = System.currentTimeMillis();
onBindViewHolder(holder, position);
long bindTime = System.currentTimeMillis() - startBind;
Log.d("Benchmark", "BIND: " + bindTime + "ms"); // ~1-2ms

// CREATE ~5-10x chậm hơn BIND
// → Recycle càng nhiều càng tốt!
```

---

## 7. Best Practices

### 7.1. ViewHolder

✅ **DO**:

```java
// Cache tất cả views trong constructor
public ProductViewHolder(@NonNull View itemView) {
    super(itemView);
    tvName = itemView.findViewById(R.id.tvName);
    tvPrice = itemView.findViewById(R.id.tvPrice);
    ivImage = itemView.findViewById(R.id.ivImage);
}

// bind() chỉ set data
public void bind(Product product) {
    tvName.setText(product.getName());
    tvPrice.setText(product.getPrice());
}
```

❌ **DON'T**:

```java
// KHÔNG findViewById() trong bind()
public void bind(Product product) {
    TextView tvName = itemView.findViewById(R.id.tvName); // ❌ CHẬM!
    tvName.setText(product.getName());
}
```

---

### 7.2. Image Loading

✅ **DO**:

```java
public void bind(Product product) {
    // Clear image cũ trước
    Glide.with(context).clear(ivImage);

    // Load image mới
    Glide.with(context)
        .load(product.getImage())
        .into(ivImage);
}
```

❌ **DON'T**:

```java
public void bind(Product product) {
    // Không clear → hiển thị image cũ khi recycle
    Glide.with(context)
        .load(product.getImage())
        .into(ivImage);
}
```

---

### 7.3. Adapter Updates

✅ **DO**:

```java
// Sử dụng notify methods cụ thể
adapter.notifyItemInserted(position);
adapter.notifyItemRemoved(position);
adapter.notifyItemRangeInserted(start, count);

// Hoặc sử dụng DiffUtil
DiffUtil.calculateDiff(callback).dispatchUpdatesTo(adapter);
```

❌ **DON'T**:

```java
// Tránh notifyDataSetChanged() nếu có thể
adapter.notifyDataSetChanged(); // ❌ Update toàn bộ, không có animation
```

---

### 7.4. Layout Optimization

✅ **DO**:

```xml
<!-- Sử dụng ConstraintLayout (flat hierarchy) -->
<androidx.constraintlayout.widget.ConstraintLayout>
    <ImageView ... />
    <TextView ... />
    <TextView ... />
</androidx.constraintlayout.widget.ConstraintLayout>
```

❌ **DON'T**:

```xml
<!-- Tránh nested layouts -->
<LinearLayout>
    <RelativeLayout>
        <LinearLayout>
            <TextView ... />
        </LinearLayout>
    </RelativeLayout>
</LinearLayout>
```

---

## 8. Debugging & Monitoring

### 8.1. Log Lifecycle

```java
@Override
public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
    Log.d("Adapter", "📦 CREATE ViewHolder (type=" + viewType + ")");
    // ... create ViewHolder
}

@Override
public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
    Log.d("Adapter", "🎨 BIND position=" + position);
    // ... bind data
}

@Override
public void onViewRecycled(@NonNull RecyclerView.ViewHolder holder) {
    super.onViewRecycled(holder);
    Log.d("Adapter", "♻️  RECYCLE ViewHolder");
}
```

---

### 8.2. Monitor Performance

```java
// Enable strict mode để detect performance issues
if (BuildConfig.DEBUG) {
    StrictMode.setThreadPolicy(new StrictMode.ThreadPolicy.Builder()
        .detectAll()
        .penaltyLog()
        .build());
}

// Monitor frame rate
rvProducts.addOnScrollListener(new RecyclerView.OnScrollListener() {
    @Override
    public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
        // Monitor scroll performance
        Choreographer.getInstance().postFrameCallback(new Choreographer.FrameCallback() {
            @Override
            public void doFrame(long frameTimeNanos) {
                // Check frame time
            }
        });
    }
});
```

---

## 9. Tổng Kết

### Key Takeaways:

1. **ViewHolder Pattern**:

   - `findViewById()` chỉ 1 lần trong constructor
   - `bind()` chỉ set data, không findViewById()
   - Cache views vào biến instance

2. **Recycle Mechanism**:

   - RecyclerView tái sử dụng ViewHolders
   - `onCreateViewHolder()`: Gọi ít (~10-15 lần)
   - `onBindViewHolder()`: Gọi nhiều (mỗi item 1 lần)

3. **Performance**:

   - Tiết kiệm RAM: Chỉ tạo views visible + buffer
   - Nhanh: Không inflate/findViewById mỗi lần scroll
   - Mượt: Không lag khi scroll

4. **Best Practices**:
   - Clear image cũ khi recycle
   - Sử dụng DiffUtil cho updates
   - Optimize layout (flat hierarchy)
   - Use specific notify methods

### Công Thức Thành Công:

```
RecyclerView = ViewHolder Pattern + Recycle Pool + Efficient Binding
             = Fast + Smooth + Memory Efficient
```

---

## 10. References

**Related Files**:

- `ProductAdapter.java`: Adapter implementation
- `ProductViewHolder.java`: ViewHolder implementation
- `Product.java`: Model class
- `item_product.xml`: Item layout
- `PaginationScrollListener.java`: Lazy loading

**Android Documentation**:

- [RecyclerView](https://developer.android.com/guide/topics/ui/layout/recyclerview)
- [ViewHolder Pattern](https://developer.android.com/reference/androidx/recyclerview/widget/RecyclerView.ViewHolder)
- [DiffUtil](https://developer.android.com/reference/androidx/recyclerview/widget/DiffUtil)
