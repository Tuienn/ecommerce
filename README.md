# E-commerce System Use Cases

Đây là tài liệu tổng hợp các chức năng chính của hệ thống E-commerce, được phân chia theo vai trò người dùng: **Customer** (Khách hàng) và **Admin** (Quản trị viên).

## 1. Customer Use Cases

### 1.1. Quản lý Tài khoản & Xác thực (Authentication)

- **UC-CUS-1: Đăng ký tài khoản**

  - **Mô tả:** Khách hàng có thể tạo tài khoản mới bằng email hoặc số điện thoại thông qua quy trình xác thực OTP.
  - **Luồng chính (2 bước):**
    1.  **Xác thực OTP:**
        - Khách hàng nhập email/số điện thoại để yêu cầu mã OTP.
        - Hệ thống gửi mã OTP (có hiệu lực trong 2 phút).
        - Khách hàng nhập mã OTP để xác thực. Nếu thành công, hệ thống trả về một token tạm thời để đăng ký.
    2.  **Hoàn tất đăng ký:**
        - Khách hàng gửi token tạm thời cùng với các thông tin cá nhân (tên, mật khẩu, email, SĐT) để tạo tài khoản.

- **UC-CUS-2: Đăng nhập**

  - **Mô tả:** Khách hàng đăng nhập vào hệ thống bằng email và mật khẩu để nhận về cặp token truy cập.
  - **Luồng chính:**
    1.  Khách hàng nhập email và mật khẩu.
    2.  Hệ thống kiểm tra thông tin.
    3.  Nếu hợp lệ, hệ thống trả về:
        - `Access Token`: Dùng để xác thực cho các yêu cầu tiếp theo (hết hạn sau 15 phút).
        - `Refresh Token`: Dùng để lấy `Access Token` mới (hết hạn sau vài ngày).
        - Thông tin cơ bản của người dùng (tên, email, vai trò).

- **UC-CUS-3: Đăng xuất**

  - **Mô tả:** Khách hàng đăng xuất khỏi hệ thống một cách an toàn.
  - **Luồng chính:**
    1.  Khách hàng gửi yêu cầu đăng xuất kèm theo `Refresh Token`.
    2.  Hệ thống sẽ thu hồi (vô hiệu hóa) `Refresh Token` đó, khiến nó không thể được sử dụng để lấy `Access Token` mới.

- **UC-CUS-3.1: Làm mới Token (Refresh Token)**

  - **Mô tả:** Khi `Access Token` hết hạn, khách hàng có thể dùng `Refresh Token` để lấy `Access Token` mới mà không cần đăng nhập lại.
  - **Luồng chính:**
    1.  Client gửi `Refresh Token` còn hạn lên server.
    2.  Server xác thực và cấp lại một `Access Token` mới.

- **UC-CUS-4: Quản lý thông tin cá nhân**
  - **Mô tả:** Khách hàng có thể xem và cập nhật thông tin cá nhân của mình.
  - **Luồng chính:**
    1.  Xem thông tin tài khoản hiện tại.
    2.  Quản lý sổ địa chỉ: Thêm, sửa, xóa, và đặt địa chỉ giao hàng mặc định.

### 1.2. Quản lý Sản phẩm & Mua sắm (Shopping)

- **UC-CUS-5: Khám phá & Tìm kiếm sản phẩm**

  - **Mô tả:** Khách hàng có thể xem, lọc và tìm kiếm sản phẩm để tìm được món hàng mong muốn.
  - **Chức năng:**
    - **Xem danh sách:** Lấy danh sách sản phẩm có phân trang.
    - **Lọc:** Lọc sản phẩm theo danh mục, sản phẩm nổi bật.
    - **Tìm kiếm:** Tìm kiếm sản phẩm theo tên.
    - **Sắp xếp:** Sắp xếp kết quả tìm kiếm theo giá (tăng/giảm) hoặc theo % giảm giá (tăng/giảm).

- **UC-CUS-6: Xem chi tiết sản phẩm**

  - **Mô tả:** Khách hàng xem thông tin đầy đủ của một sản phẩm, bao gồm hình ảnh, mô tả chi tiết, giá, số lượng tồn kho, v.v.

- **UC-CUS-7: Quản lý giỏ hàng (Cart)**
  - **Mô tả:** Khách hàng sử dụng giỏ hàng để tạm thời lưu trữ các sản phẩm muốn mua.
  - **Chức năng:**
    - **Thêm vào giỏ:** Thêm một sản phẩm với số lượng mong muốn. Hệ thống sẽ kiểm tra số lượng tồn kho.
    - **Xem giỏ hàng:** Xem danh sách các sản phẩm trong giỏ, có phân trang và tìm kiếm sản phẩm ngay trong giỏ.
    - **Cập nhật số lượng:** Thay đổi số lượng của một sản phẩm. Nếu số lượng về 0, sản phẩm sẽ bị xóa.
    - **Xóa sản phẩm:** Xóa một hoặc nhiều sản phẩm khỏi giỏ.
    - **Xóa toàn bộ giỏ hàng:** Dọn dẹp tất cả sản phẩm trong giỏ.

### 1.3. Quản lý Đơn hàng (Order)

- **UC-CUS-8: Kiểm tra và tính toán giỏ hàng (Cart Checkout)**

  - **Mô tả:** Trước khi đặt hàng, khách hàng có thể xem lại tóm tắt các sản phẩm được chọn từ giỏ hàng để kiểm tra lần cuối.
  - **Luồng chính:**
    1.  Khách hàng chọn các sản phẩm muốn mua từ giỏ hàng và yêu cầu "checkout".
    2.  Hệ thống kiểm tra lại tình trạng (còn bán, đủ hàng) và tính toán tổng số tiền cho các sản phẩm được chọn.
    3.  Trả về một bản tóm tắt gồm danh sách sản phẩm, tổng tiền hàng.

- **UC-CUS-9: Tạo đơn hàng (Create Order)**

  - **Mô tả:** Khách hàng xác nhận thông tin và chính thức tạo đơn hàng.
  - **Luồng chính:**
    1.  Khách hàng gửi yêu cầu tạo đơn hàng với: danh sách sản phẩm (từ bước checkout), ID địa chỉ giao hàng, và thông tin thanh toán.
    2.  Hệ thống xác thực lại lần cuối (tồn kho, địa chỉ).
    3.  Tạo đơn hàng mới với trạng thái "Đang xử lý" (PROCESSING).
    4.  **Trừ số lượng tồn kho** của các sản phẩm tương ứng.
    5.  **Xóa các sản phẩm đã đặt** khỏi giỏ hàng của người dùng.

- **UC-CUS-10: Xem lịch sử & trạng thái đơn hàng**

  - **Mô tả:** Khách hàng theo dõi các đơn hàng đã đặt.
  - **Chức năng:**
    - Xem danh sách đơn hàng có phân trang.
    - Lọc đơn hàng theo trạng thái (Đang xử lý, Đã thanh toán, Đang giao, Hoàn thành, Đã hủy...).
    - Xem thông tin chi tiết của một đơn hàng cụ thể.

- **UC-CUS-11: Hủy đơn hàng**
  - **Mô tả:** Khách hàng có thể tự hủy đơn hàng nếu đơn hàng chưa được xử lý.
  - **Luồng chính:**
    1.  Khách hàng yêu cầu hủy đơn hàng.
    2.  Hệ thống kiểm tra nếu trạng thái đơn hàng là "Đang xử lý" (PROCESSING) hoặc "Đã thanh toán" (PAID).
    3.  Nếu hợp lệ, chuyển trạng thái đơn hàng thành "Đã hủy" (CANCELLED).
    4.  **Hoàn trả lại số lượng tồn kho** cho các sản phẩm trong đơn hàng đã hủy.

## 2. Admin Use Cases

### 2.1. Quản lý Người dùng (User Management)

- **UC-ADM-1: Quản lý tài khoản người dùng**
  - **Mô tả:** Admin quản lý tất cả tài khoản trong hệ thống.
  - **Chức năng:**
    - Xem danh sách người dùng (phân trang, lọc theo vai trò, trạng thái).
    - Xem chi tiết một người dùng.
    - Tạo tài khoản người dùng mới (bao gồm cả tài khoản admin khác).
    - Cập nhật thông tin người dùng.
    - Xóa người dùng.
    - Kích hoạt/Vô hiệu hóa tài khoản người dùng.

### 2.2. Quản lý Danh mục (Category Management)

- **UC-ADM-2: Quản lý danh mục sản phẩm**
  - **Mô tả:** Admin quản lý các danh mục sản phẩm.
  - **Chức năng:**
    - Xem danh sách tất cả danh mục.
    - Tạo danh mục mới.
    - Tạo nhiều danh mục cùng lúc (bulk create).
    - Cập nhật tên danh mục.
    - Xóa danh mục.
    - Kích hoạt/Vô hiệu hóa danh mục.

### 2.3. Quản lý Sản phẩm (Product Management)

- **UC-ADM-3: Quản lý sản phẩm**
  - **Mô tả:** Admin quản lý kho sản phẩm của cửa hàng.
  - **Chức năng:**
    - Xem danh sách tất cả sản phẩm (kể cả sản phẩm ẩn).
    - Tạo sản phẩm mới (kèm upload hình ảnh).
    - Cập nhật thông tin sản phẩm (tên, mô tả, giá, tồn kho, hình ảnh...).
    - Xóa sản phẩm.
    - Kích hoạt/Vô hiệu hóa (ẩn/hiện) sản phẩm.

### 2.4. Quản lý Đơn hàng (Order Management)

- **UC-ADM-4: Quản lý đơn hàng của khách**
  - **Mô tả:** Admin theo dõi và xử lý các đơn hàng.
  - **Chức năng:**
    - Xem danh sách tất cả đơn hàng.
    - Xem chi tiết một đơn hàng.
    - Cập nhật trạng thái đơn hàng (ví dụ: từ "Đã thanh toán" -> "Đang giao hàng").
    - Xác thực trạng thái thanh toán từ cổng thanh toán (ví dụ: "Thành công", "Thất bại").
