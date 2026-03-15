# Cache Middleware Documentation

## Tổng quan

Hai middleware này cung cấp giải pháp caching hoàn chỉnh cho ứng dụng Express.js sử dụng Redis:

- **`cache.middleware.ts`**: Lưu trữ (cache) kết quả của các GET request
- **`cacheEvict.middleware.ts`**: Xóa (evict) cache khi dữ liệu thay đổi

---

## 1. Cache Middleware (`cache.middleware.ts`)

### Mục đích

Middleware này tự động cache kết quả của các GET request vào Redis để giảm tải cho database và tăng tốc độ phản hồi.

### Các Function

#### `generateCacheKey(req: Request): string`

**Mô tả**: Tạo cache key duy nhất dựa trên HTTP method và URL của request.

**Tham số**:

- `req`: Express Request object

**Trả về**:

- String theo format: `cache:{METHOD}:{URL}`

**Ví dụ**:

```typescript
// Request: GET /api/products?page=1&limit=10
// Cache key: "cache:GET:/api/products?page=1&limit=10"
```

**Lưu ý**: Query parameters được tự động bao gồm trong URL, đảm bảo mỗi request với params khác nhau có cache riêng.

---

#### `cacheMiddleware(ttl: number)`

**Mô tả**: Middleware chính để cache GET requests. Kiểm tra cache trước khi xử lý request, và tự động lưu response vào cache.

**Tham số**:

- `ttl` (Time To Live): Thời gian cache tồn tại tính bằng giây

**Hoạt động**:

1. **Kiểm tra method**: Chỉ cache GET requests

    ```typescript
    if (req.method !== 'GET') {
        return next() // Bỏ qua cache cho POST, PUT, DELETE, etc.
    }
    ```

2. **Kiểm tra Redis**: Đảm bảo Redis client đã sẵn sàng

    ```typescript
    if (!redisClient.isReady) {
        console.warn('Redis client not ready, skipping cache')
        return next()
    }
    ```

3. **Cache HIT**: Nếu tìm thấy cache, trả về ngay lập tức

    ```typescript
    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`)
        return res.status(200).json(JSON.parse(cachedData))
    }
    ```

4. **Cache MISS**: Nếu không có cache
    - Override `res.json()` để intercept response
    - Khi response được gửi, tự động lưu vào cache
    - Chỉ cache responses thành công (status 2xx)

**Ví dụ sử dụng**:

```typescript
import { cacheMiddleware } from './middlewares/cache.middleware'

// Cache trong 5 phút (300 giây)
router.get('/products', cacheMiddleware(300), productController.getAll)

// Cache trong 1 giờ (3600 giây)
router.get('/categories', cacheMiddleware(3600), categoryController.getAll)

// Cache trong 1 ngày (86400 giây)
router.get('/settings', cacheMiddleware(86400), settingsController.get)
```

**Lợi ích**:

- ✅ Giảm tải database
- ✅ Tăng tốc độ response
- ✅ Tự động xử lý cache miss/hit
- ✅ Không block request nếu Redis fail
- ✅ Chỉ cache responses thành công

---

## 2. Cache Evict Middleware (`cacheEvict.middleware.ts`)

### Mục đích

Middleware này tự động xóa cache khi dữ liệu được thay đổi (POST, PUT, DELETE requests), đảm bảo cache luôn đồng bộ với database.

### Interface

#### `CacheEvictOptions`

```typescript
interface CacheEvictOptions {
    pattern?: string // Pattern để match nhiều keys
    keys?: (string | ((req: Request) => string))[] // Danh sách keys cụ thể
}
```

**Thuộc tính**:

- `pattern`: Redis pattern để xóa nhiều keys cùng lúc (sử dụng wildcards)
- `keys`: Mảng các cache keys cần xóa (có thể là string hoặc function)

---

### Các Function

#### `cacheEvictMiddleware(options: CacheEvictOptions)`

**Mô tả**: Middleware chính để xóa cache sau khi request thành công.

**Tham số**:

- `options`: Object chứa pattern và/hoặc keys cần xóa

**Hoạt động**:

1. **Override res.json()**: Intercept response để xóa cache
2. **Kiểm tra status**: Chỉ xóa cache nếu response thành công (2xx)
3. **Xóa cache async**: Không block response, xóa cache ở background
4. **Log kết quả**: Hiển thị số lượng keys đã xóa

**Ví dụ sử dụng**:

```typescript
import { cacheEvictMiddleware } from './middlewares/cacheEvict.middleware'

// Xóa tất cả cache của products khi tạo product mới
router.post(
    '/products',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*'
    }),
    productController.create
)

// Xóa cache cụ thể khi update product
router.put(
    '/products/:id',
    cacheEvictMiddleware({
        keys: [(req) => `cache:GET:/api/products/${req.params.id}`, 'cache:GET:/api/products?page=1']
    }),
    productController.update
)

// Xóa cả pattern và keys cụ thể
router.delete(
    '/products/:id',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*',
        keys: [
            (req) => `cache:GET:/api/products/${req.params.id}`,
            'cache:GET:/api/categories' // Xóa cache categories vì có liên quan
        ]
    }),
    productController.delete
)
```

---

#### `evictCache(req: Request, options: CacheEvictOptions): Promise<number>`

**Mô tả**: Function nội bộ để xử lý logic xóa cache.

**Tham số**:

- `req`: Express Request object
- `options`: Cache eviction options

**Trả về**:

- Promise<number>: Số lượng keys đã xóa thành công

**Hoạt động**:

1. **Kiểm tra Redis**: Đảm bảo client sẵn sàng
2. **Thu thập keys**:
    - Nếu có `pattern`: Scan Redis để tìm matching keys
    - Nếu có `keys`: Resolve các keys (xử lý functions)
3. **Loại bỏ duplicates**: Đảm bảo mỗi key chỉ xóa 1 lần
4. **Xóa từng key**: Loop qua và xóa từng key
5. **Trả về count**: Tổng số keys đã xóa

**Ví dụ flow**:

```typescript
// Request: DELETE /api/products/123
// Options: { pattern: 'cache:GET:/api/products*' }

// 1. Scan Redis tìm keys matching pattern
// Tìm thấy: [
//   'cache:GET:/api/products',
//   'cache:GET:/api/products?page=1',
//   'cache:GET:/api/products?page=2',
//   'cache:GET:/api/products/123'
// ]

// 2. Xóa tất cả 4 keys
// 3. Return 4
```

---

#### `scanKeys(pattern: string): Promise<string[]>`

**Mô tả**: Function nội bộ để scan Redis tìm keys matching pattern. Sử dụng SCAN thay vì KEYS để tránh block Redis.

**Tham số**:

- `pattern`: Redis pattern (hỗ trợ wildcards: `*`, `?`, `[]`)

**Trả về**:

- Promise<string[]>: Mảng các keys matching pattern

**Hoạt động**:

1. **Sử dụng SCAN cursor**: Iterate qua Redis database
2. **Batch processing**: Xử lý 100 keys mỗi lần
3. **Loop until done**: Continue cho đến khi cursor = 0
4. **Return all keys**: Tổng hợp tất cả keys tìm được

**Tại sao dùng SCAN thay vì KEYS?**

- ✅ SCAN không block Redis server
- ✅ An toàn với database lớn
- ✅ Không ảnh hưởng performance
- ❌ KEYS block Redis và có thể gây timeout

**Ví dụ patterns**:

```typescript
// Xóa tất cả cache của products
'cache:GET:/api/products*'

// Xóa cache của tất cả GET requests
'cache:GET:*'

// Xóa tất cả cache
'cache:*'

// Xóa cache của specific endpoint với bất kỳ query params
'cache:GET:/api/products?*'
```

---

## 3. Workflow Hoàn Chỉnh

### Scenario: Product Management

```typescript
import { Router } from 'express'
import { cacheMiddleware } from './middlewares/cache.middleware'
import { cacheEvictMiddleware } from './middlewares/cacheEvict.middleware'
import productController from './controllers/product.controller'

const router = Router()

// 1. GET products - Cache trong 5 phút
router.get('/products', cacheMiddleware(300), productController.getAll)

// 2. GET single product - Cache trong 10 phút
router.get('/products/:id', cacheMiddleware(600), productController.getById)

// 3. CREATE product - Xóa tất cả cache của products
router.post(
    '/products',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*'
    }),
    productController.create
)

// 4. UPDATE product - Xóa cache của product đó và danh sách
router.put(
    '/products/:id',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*',
        keys: [(req) => `cache:GET:/api/products/${req.params.id}`]
    }),
    productController.update
)

// 5. DELETE product - Xóa tất cả cache liên quan
router.delete(
    '/products/:id',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*',
        keys: [
            'cache:GET:/api/categories' // Categories có thể hiển thị product count
        ]
    }),
    productController.delete
)

export default router
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Request                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  GET Request? │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         │ YES                     │ NO
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│ Cache Middleware│       │ Cache Evict     │
│                 │       │ Middleware      │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
    ┌─────────┐            ┌──────────────┐
    │ Cache   │            │ Process      │
    │ Hit?    │            │ Request      │
    └────┬────┘            └──────┬───────┘
         │                        │
    ┌────┼────┐                   ▼
    │YES      │NO          ┌──────────────┐
    ▼         ▼            │ Success?     │
┌────────┐ ┌──────┐       └──────┬───────┘
│ Return │ │Process│              │
│ Cache  │ │Request│         ┌────┼────┐
└────────┘ └───┬──┘         │YES      │NO
               │            ▼         ▼
               ▼      ┌──────────┐ ┌────────┐
          ┌─────────┐ │ Evict    │ │ Return │
          │ Cache   │ │ Cache    │ │ Error  │
          │ Response│ └──────────┘ └────────┘
          └─────────┘
```

---

## 4. Best Practices

### TTL Guidelines

```typescript
// Dữ liệu thay đổi thường xuyên: 1-5 phút
router.get('/products', cacheMiddleware(300), ...)

// Dữ liệu ít thay đổi: 10-30 phút
router.get('/categories', cacheMiddleware(1800), ...)

// Dữ liệu tĩnh: 1-24 giờ
router.get('/settings', cacheMiddleware(86400), ...)

// Dữ liệu real-time: Không cache
router.get('/live-prices', ...) // No cache middleware
```

### Cache Eviction Strategies

```typescript
// 1. Aggressive eviction - Xóa tất cả liên quan
router.post('/products',
    cacheEvictMiddleware({
        pattern: 'cache:GET:*' // Xóa toàn bộ cache
    }),
    ...
)

// 2. Targeted eviction - Chỉ xóa cache liên quan (RECOMMENDED)
router.post('/products',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*'
    }),
    ...
)

// 3. Precise eviction - Xóa keys cụ thể
router.put('/products/:id',
    cacheEvictMiddleware({
        keys: [(req) => `cache:GET:/api/products/${req.params.id}`]
    }),
    ...
)

// 4. Combined approach - Pattern + specific keys
router.delete('/products/:id',
    cacheEvictMiddleware({
        pattern: 'cache:GET:/api/products*',
        keys: ['cache:GET:/api/categories']
    }),
    ...
)
```

### Error Handling

Cả hai middleware đều có error handling built-in:

- ✅ Không crash app nếu Redis fail
- ✅ Log errors để debug
- ✅ Gracefully fallback (skip cache)
- ✅ Request vẫn được xử lý bình thường

---

## 5. Monitoring & Debugging

### Console Logs

```bash
# Cache HIT - Tìm thấy cache
✅ Cache HIT: cache:GET:/api/products?page=1

# Cache MISS - Không có cache
❌ Cache MISS: cache:GET:/api/products?page=1

# Cache được lưu
💾 Cached: cache:GET:/api/products?page=1 (TTL: 300s)

# Cache được xóa
🗑️  Evicted cache key: cache:GET:/api/products?page=1
🗑️  Cache evicted: 5 key(s)

# Warnings
⚠️  Redis client not ready, skipping cache
⚠️  Error caching data for cache:GET:/api/products: Connection timeout
```

### Redis CLI Commands

```bash
# Xem tất cả cache keys
redis-cli KEYS "cache:*"

# Xem cache của specific endpoint
redis-cli KEYS "cache:GET:/api/products*"

# Xem nội dung cache
redis-cli GET "cache:GET:/api/products?page=1"

# Xem TTL còn lại
redis-cli TTL "cache:GET:/api/products?page=1"

# Xóa tất cả cache
redis-cli FLUSHDB

# Xóa cache theo pattern
redis-cli --scan --pattern "cache:GET:/api/products*" | xargs redis-cli DEL
```

---

## 6. Performance Impact

### Trước khi có cache:

```
GET /api/products
├── Database query: 150ms
├── Data processing: 50ms
└── Total: 200ms
```

### Sau khi có cache (Cache HIT):

```
GET /api/products
├── Redis lookup: 2ms
└── Total: 2ms (100x faster!)
```

### Cache Eviction Impact:

```
POST /api/products
├── Process request: 200ms
├── Cache eviction: 5ms (async, không block)
└── Total: 200ms (không ảnh hưởng)
```

---

## 7. Troubleshooting

### Cache không hoạt động?

1. **Kiểm tra Redis connection**:

    ```typescript
    console.log('Redis ready:', redisClient.isReady)
    ```

2. **Kiểm tra method**: Chỉ GET requests được cache

3. **Kiểm tra status code**: Chỉ 2xx responses được cache

4. **Kiểm tra logs**: Xem console để debug

### Cache không được xóa?

1. **Kiểm tra pattern**: Đảm bảo pattern match đúng keys

2. **Kiểm tra status code**: Chỉ xóa cache khi response thành công

3. **Test pattern với Redis CLI**:
    ```bash
    redis-cli --scan --pattern "cache:GET:/api/products*"
    ```

### Memory issues?

1. **Giảm TTL**: Cache ít hơn, ngắn hơn

2. **Targeted caching**: Chỉ cache endpoints quan trọng

3. **Monitor Redis memory**:
    ```bash
    redis-cli INFO memory
    ```

---

## 8. Kết luận

Hai middleware này cung cấp giải pháp caching hoàn chỉnh:

✅ **Tự động**: Không cần code thêm trong controllers
✅ **Linh hoạt**: Dễ dàng config TTL và eviction strategies
✅ **An toàn**: Error handling tốt, không crash app
✅ **Hiệu quả**: Giảm tải database, tăng tốc response
✅ **Dễ debug**: Logs chi tiết, dễ monitor

**Recommended usage**: Áp dụng cho tất cả GET endpoints có traffic cao và dữ liệu không thay đổi quá thường xuyên.
