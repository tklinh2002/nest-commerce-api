# E-Commerce Backend — Lộ trình Triển khai

Lộ trình dành cho dự án cá nhân, không bao gồm bước viết test tự động (unit/e2e test) — ưu tiên hoàn thiện tính năng và chạy được end-to-end trước.

---

## Phase 1: Setup & Core Auth (Ngày 1 - 2)

* Khởi tạo dự án NestJS (`nest new ecommerce-backend`), cấu hình ESLint, Prettier, `.env`.
* Dựng `docker-compose.yml` (Postgres, Redis), chạy `docker compose up -d`.
* Cấu hình `ConfigModule` đọc và validate biến môi trường.
* Tích hợp Prisma, viết schema ban đầu, chạy migration đầu tiên.
* Dựng `AuthModule`: Register, Login, JWT Strategy (access + refresh token), hash password bằng bcrypt.
* Lưu refresh token (hash) trong DB hoặc Redis để có thể revoke khi logout.
* Tạo `RolesGuard` + `JwtAuthGuard` bảo vệ các route theo `USER` / `ADMIN`.
* Bật Helmet, cấu hình CORS whitelist, thêm `@nestjs/throttler` cho rate limit cơ bản.

## Phase 2: Quản lý Danh mục & Sản phẩm (Ngày 3 - 4)

* Dựng `CategoryModule`: CRUD danh mục.
* Dựng `ProductModule`: CRUD sản phẩm, phân trang, lọc theo giá/danh mục.
* Thêm tìm kiếm sản phẩm theo tên (Postgres `ILIKE`).
* Dựng `UploadsModule`: upload ảnh sản phẩm qua Multer, lưu lên Cloudinary (hoặc local `/uploads` khi dev).
* Tích hợp Swagger để test và hiển thị tài liệu API.

## Phase 3: Giỏ hàng & Đơn hàng (Trọng tâm) (Ngày 5 - 7)

* Dựng `CartModule`: thêm/sửa/xóa sản phẩm trong giỏ hàng.
* Dựng `OrderModule`: tạo đơn hàng từ giỏ hàng, tính tổng tiền.
* **Transaction:** dùng `prisma.$transaction` để kiểm tra tồn kho, trừ kho và tạo đơn hàng đồng thời, tránh race condition khi nhiều người mua cùng lúc.
* Thêm API hủy đơn (chỉ khi đơn còn `PENDING`) và hoàn lại tồn kho tương ứng.

## Phase 4: Async Jobs & Thanh toán (Ngày 8 - 9)

* Tích hợp `@nestjs/bullmq` kết nối Redis.
* Viết worker gửi email xác nhận khi đơn hàng tạo thành công.
* Viết delayed job: tự động hủy đơn `PENDING` quá X phút chưa thanh toán và cộng lại `stock`.
* Tích hợp cổng thanh toán Sandbox (Stripe hoặc VNPay), cập nhật `paymentStatus` qua webhook.

## Phase 5: Hoàn thiện & Vận hành (Ngày 10 - 11)

* Thêm endpoint `/health` (dùng `@nestjs/terminus`) kiểm tra DB + Redis.
* Thêm logging có cấu trúc (Pino hoặc Winston) thay cho `console.log`.
* Viết `AllExceptionsFilter` và `TransformResponseInterceptor` để chuẩn hóa response/error toàn hệ thống.
* Viết README hướng dẫn chạy local (docker compose, migrate, seed data mẫu).
* (Tùy chọn) Seed dữ liệu mẫu (danh mục, sản phẩm) để demo nhanh.

## Phase 6 (Mở rộng — không bắt buộc)

* Product variants (size, màu sắc) nếu muốn sản phẩm phức tạp hơn.
* Coupon / mã giảm giá.
* Đánh giá & rating sản phẩm.
* Wishlist.
* Trang thống kê đơn giản cho Admin (doanh thu theo ngày/tháng).
* Deploy lên VPS/Render/Railway + CI đơn giản (build & deploy tự động khi push).
