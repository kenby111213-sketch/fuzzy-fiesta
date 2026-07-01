# ☕ Quản lý quán cà phê

Web app quản lý quán cà phê: bán hàng (POS), quản lý bàn, thực đơn, báo cáo doanh thu và đăng nhập.

## Công nghệ
- **Backend:** Node.js + Express + MongoDB (Mongoose), xác thực bằng JWT.
- **Frontend:** HTML/CSS/JS thuần (không cần build), phục vụ tĩnh bởi Express.

## Chức năng
- **Bán hàng (POS):** chọn món, gán bàn hoặc mang đi, giảm giá, ghi chú, thanh toán.
- **Bàn:** sơ đồ bàn, xem/thanh toán đơn theo bàn.
- **Thực đơn:** thêm/sửa/xóa món, bật tắt bán.
- **Báo cáo:** doanh thu hôm nay, biểu đồ 7 ngày, món bán chạy.
- **Đăng nhập:** một tài khoản chung, đổi mật khẩu trong app.

## Chạy trên máy (local)
```bash
npm install
cp .env.example .env   # rồi điền MONGODB_URI và JWT_SECRET
npm run seed           # nạp thực đơn, bàn và tài khoản mặc định (chạy 1 lần)
npm start              # mở http://localhost:3000
```
Tài khoản mặc định: **admin / cafe123** (đổi ngay sau khi đăng nhập).

## Biến môi trường
| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `MONGODB_URI` | ✅ | Chuỗi kết nối MongoDB Atlas |
| `JWT_SECRET` | ✅ | Chuỗi bí mật ký token đăng nhập |
| `PORT` | — | Cổng chạy (mặc định 3000; host tự đặt) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | — | Tài khoản tạo lúc seed |

## Deploy lên Render
1. Đẩy repo này lên GitHub.
2. Vào [render.com](https://render.com) → **New → Web Service** → chọn repo.
3. Render tự đọc `render.yaml`. Nhập `MONGODB_URI` trong mục Environment (JWT_SECRET được sinh tự động).
4. Trên MongoDB Atlas → **Network Access** → thêm `0.0.0.0/0` để Render kết nối được.
5. Deploy xong sẽ có link công khai `https://...onrender.com`.
