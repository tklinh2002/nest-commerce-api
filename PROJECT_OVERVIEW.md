# E-Commerce Backend — Mô tả Dự án & Tech Stack

Dự án Backend cá nhân cho nền tảng thương mại điện tử (E-Commerce), xây dựng bằng **NestJS**, ưu tiên hoàn thiện tính năng cốt lõi (MVP) nhanh, kiến trúc module rõ ràng, dễ mở rộng về sau.

---

## 1. Tổng quan & Mục tiêu

* **Loại dự án:** Backend API (RESTful) cho E-Commerce, dùng cho mục đích học tập / portfolio cá nhân.
* **Mục tiêu chính:**
  * Hoàn thiện tính năng cốt lõi (auth, sản phẩm, giỏ hàng, đơn hàng) nhanh và chắc.
  * Đảm bảo toàn vẹn dữ liệu khi trừ tồn kho (transaction, tránh race condition).
  * Code sạch, theo chuẩn NestJS, dễ đọc, dễ mở rộng dần theo thời gian.
* **Kiến trúc:** Modular Monolith (chia theo NestJS modules), không cần microservices ở giai đoạn này.
* **Phạm vi:** Không viết test tự động (dự án cá nhân, ưu tiên tốc độ hoàn thiện tính năng).

---

## 2. Tech Stack

| Thành phần | Công nghệ | Mục đích / Lý do lựa chọn |
| :--- | :--- | :--- |
| **Core Runtime & Framework** | NestJS + Express + TypeScript | Cấu trúc module rõ ràng, Dependency Injection, cộng đồng lớn. |
| **Database (RDBMS)** | PostgreSQL | Đảm bảo ACID, hỗ trợ quan hệ đơn hàng/tồn kho, hỗ trợ JSONB. |
| **ORM & Migrations** | Prisma | Type-safe end-to-end, migration nhanh, cú pháp trực quan. |
| **Cache & In-Memory Store** | Redis | Cache danh mục/session, rate limiting, lưu Refresh Token, broker cho Queue. |
| **Message Queue & Jobs** | BullMQ (`@nestjs/bullmq`) | Gửi email xác nhận đơn hàng, tự động hoàn kho khi quá hạn thanh toán. |
| **Authentication & AuthZ** | Passport.js + JWT + bcrypt | Access Token / Refresh Token, phân quyền Role-based (`USER`, `ADMIN`). |
| **Validation & Transform** | `class-validator` + `class-transformer` | Validate DTO đầu vào qua NestJS ValidationPipe. |
| **API Documentation** | `@nestjs/swagger` | Sinh Swagger UI (OpenAPI 3.0) để test endpoint trực tiếp. |
| **File / Ảnh sản phẩm** | Multer + Cloudinary (hoặc lưu local `/uploads` khi dev) | Upload & lưu trữ ảnh sản phẩm, tránh lưu binary trong DB. |
| **Bảo mật cơ bản** | Helmet, `@nestjs/throttler`, CORS config | Chặn header không an toàn, rate limit API, giới hạn origin gọi API. |
| **Logging** | Pino (`nestjs-pino`) hoặc Winston | Log có cấu trúc, dễ debug khi chạy production. |
| **DevOps / Environment** | Docker & Docker Compose | Khởi tạo PostgreSQL và Redis nhanh cho local. |

---

## 3. Kiến trúc Thư mục

```text
src/
├── common/                # Shared decorators, guards, interceptors, filters, DTOs
│   ├── decorators/        # @CurrentUser(), @Roles()
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── filters/            # AllExceptionsFilter
│   └── interceptors/       # TransformResponseInterceptor
├── config/                 # Configuration loader & validation (env)
├── database/                # PrismaService, PrismaModule
├── modules/
│   ├── auth/                  # Đăng ký, đăng nhập, JWT strategy, refresh token
│   ├── users/                   # Quản lý tài khoản, địa chỉ giao hàng
│   ├── categories/                # Danh mục sản phẩm (cha / con)
│   ├── products/                    # Quản lý sản phẩm, tồn kho, tìm kiếm
│   ├── uploads/                       # Upload ảnh sản phẩm (Multer + Cloudinary)
│   ├── cart/                            # Giỏ hàng (CRUD item trong giỏ)
│   ├── orders/                            # Tạo đơn, trừ tồn kho, tính tiền (Prisma transaction)
│   ├── payments/                            # Xử lý trạng thái thanh toán (Stripe / VNPay Sandbox)
│   └── mail/                                  # BullMQ Consumer gửi email thông báo
├── app.module.ts
└── main.ts
```

---

## 4. Mô hình Cơ sở Dữ liệu (Prisma Schema)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  fullName     String?
  role         Role      @default(USER)
  addresses    Address[]
  orders       Order[]
  cart         Cart?
  refreshToken String?   // hash refresh token hiện tại (hoặc lưu qua Redis)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Address {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  receiver  String
  phone     String
  street    String
  city      String
  isDefault Boolean  @default(false)
  orders    Order[]
}

model Category {
  id        String     @id @default(uuid())
  name      String     @unique
  slug      String     @unique
  products  Product[]
  createdAt DateTime   @default(now())
}

model Product {
  id          String      @id @default(uuid())
  name        String
  slug        String      @unique
  description String?
  price       Decimal     @db.Decimal(10, 2)
  stock       Int         @default(0)
  images      String[]    // nhiều ảnh thay vì 1 imageUrl
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  cartItems   CartItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int      @default(1)

  @@unique([cartId, productId])
}

model Order {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  addressId     String
  address       Address       @relation(fields: [addressId], references: [id])
  totalAmount   Decimal       @db.Decimal(10, 2)
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  items         OrderItem[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  price     Decimal  @db.Decimal(10, 2)
  quantity  Int
}
```

> Ghi chú: `Product.images` chuyển từ `imageUrl` (1 ảnh) sang mảng `String[]` để hỗ trợ nhiều ảnh sản phẩm. `User.refreshToken` được thêm để có nơi lưu/so khớp refresh token khi cần revoke.

---

## 5. Docker Compose (môi trường local)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ecommerce_postgres
    restart: always
    environment:
      POSTGRES_USER: nestuser
      POSTGRES_PASSWORD: nestpassword
      POSTGRES_DB: ecommerce_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: ecommerce_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 6. Biến môi trường cần có (`.env.example`)

```env
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://nestuser:nestpassword@localhost:5432/ecommerce_db"

# JWT
JWT_ACCESS_SECRET=changeme
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=changeme
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Upload ảnh (nếu dùng Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Thanh toán (Sandbox)
STRIPE_SECRET_KEY=
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
```

---

## 7. Các điểm cần lưu ý / đề xuất bổ sung so với bản gốc

* **Ảnh sản phẩm:** cần module `uploads` (Multer) + dịch vụ lưu trữ ngoài (Cloudinary/S3) thay vì chỉ lưu URL suông.
* **Refresh Token:** nên lưu hash trong DB hoặc Redis để có thể revoke khi logout / đổi mật khẩu.
* **Tìm kiếm sản phẩm:** dùng `ILIKE` của Postgres là đủ cho quy mô cá nhân, không cần Elasticsearch.
* **Hoàn kho tự động:** cần 1 BullMQ job dạng delayed job — hủy đơn `PENDING` quá X phút chưa thanh toán và cộng lại `stock`.
* **Bảo mật cơ bản:** bật Helmet, cấu hình CORS whitelist, và `@nestjs/throttler` để chống spam API.
* **Health check:** thêm endpoint `/health` (dùng `@nestjs/terminus`) để biết service + DB + Redis còn sống không.
* **Mở rộng (không bắt buộc MVP):** coupon/giảm giá, đánh giá sản phẩm, wishlist, product variants (size/màu) — để ở giai đoạn sau khi phần lõi ổn định.
