# Tài liệu Hệ Thống Backend E-commerce

## 1. Tổng quan kiến trúc

Hệ thống tuân theo kiến trúc **Modular**, chia nhỏ các chức năng thành các modules độc lập (User, Product, Order, etc.), mỗi module tuân theo mô hình **Controller - Service - Model - Route**.

### Cấu trúc thư mục chính (`src/`)

- `modules/`: Chứa các modules chức năng (logic nghiệp vụ chính).
- `middlewares/`: Chứa các middleware xử lý trung gian (xác thực, log, lỗi...).
- `models/`: (Được tích hợp trong từng module).
- `configs/`, `constants/`, `helpers/`, `utils/`: Các thư viện và cấu hình bổ trợ.

## 2. Middlewares

Hệ thống sử dụng các middleware quan trọng sau để đảm bảo bảo mật và luồng dữ liệu chuẩn:

- **`authen.middleware.ts`**:
    - Xác thực người dùng thông qua **JWT (Access Token)**.
    - Kiểm tra tính hợp lệ của token, giải mã lấy `userId`.
    - Kiểm tra trạng thái `isActive` của user (chặn nếu account bị vô hiệu hóa).
    - Gắn thông tin `user` vào `req` để các bước sau sử dụng.
- **`authorize.middleware.ts`**:
    - Phân quyền dựa trên vai trò (**RBAC**).
    - Nhận vào danh sách các roles cho phép (ví dụ: `['admin', 'staff']`).
    - Chặn truy cập nếu user không có role phù hợp.
- **`error.middleware.ts`**:
    - Xử lý lỗi tập trung. Bắt các exceptions ném ra từ controller/service và trả về response lỗi chuẩn hóa.
- **`sanitize.middleware.ts`**:
    - Làm sạch dữ liệu đầu vào (body, query, params) để ngăn chặn các cuộc tấn công injection cơ bản.
- **`rateLimiter.middleware.ts`**:
    - Giới hạn số lượng request từ một IP để chống spam/DDoS (được áp dụng trong môi trường Production).
- **`uploadCloudinary.middleware.ts`**:
    - Middleware hỗ trợ upload file/ảnh lên Cloudinary.

## 3. Modules và Chức năng chính

Hệ thống được chia thành các business modules sau:

### 3.1. User Module (`modules/user`)

Quản lý thông tin người dùng và địa chỉ giao hàng.

- **Model**: `User`
    - Thông tin: Tên, email, password (hashed), phone, role (`admin`, `customer`, `staff`), isActive.
    - **Addresses**: Mảng các địa chỉ giao hàng, hỗ trợ set địa chỉ mặc định.
- **Service (`UserService`)**:
    - `createDefaultAdmin`: Tạo admin mặc định khi khởi chạy nếu chưa có.
    - `createUser`, `updateUser`: CRUD người dùng.
    - `addAddress`: Thêm địa chỉ mới. Có logic tự động xử lý `isDefault` (nếu là địa chỉ đầu tiên hoặc được user chỉ định).
    - `updateDefaultAddress`: Cho phép đổi địa chỉ mặc định, tự động reset các địa chỉ còn lại về `false`.

### 3.2. Auth Module (`modules/auth`)

Xử lý đăng nhập, bảo mật.

- Bao gồm cả chức năng OTP (`modules/auth/otp`) để xác thực 2 lớp hoặc reset password.
- Quản lý cấp phát và verify Tokens.

### 3.3. Product Module (`modules/product`)

Quản lý sản phẩm.

- **Controller/Service**: Xử lý logic tạo, sửa, xóa, lấy danh sách sản phẩm.
- Tích hợp upload ảnh (có thể liên kết với middleware cloudinary).

### 3.4. Order & Cart Module (`modules/order`, `modules/cart`)

- **Cart**: Quản lý giỏ hàng của người dùng.
- **Order**: Xử lý đặt hàng, trạng thái đơn hàng và luồng thanh toán.

### 3.5. Category Module (`modules/category`)

- Quản lý danh mục sản phẩm, giúp phân loại và tìm kiếm sản phẩm dễ dàng.

## 4. Các điểm nổi bật về Kỹ thuật

- **Bảo mật mật khẩu**: Sử dụng `bcrypt` (thông qua `hashPassword`, `comparePassword`) để mã hóa mật khẩu trước khi lưu.
- **Pagination**: Model User (và các model khác) tích hợp `mongoose-paginate-v2` để hỗ trợ phân trang dữ liệu danh sách.
- **Geospatial Data**: User Address hỗ trợ lưu tọa độ (`Point` coordinates), sẵn sàng cho tính năng tìm kiếm theo vị trí/tính phí ship.
- **Global Error Handling**: Sử dụng các custom Error classes (`AuthFailureError`, `NotFoundError`, `ConflictRequestError`...) để quản lý lỗi nhất quán.
