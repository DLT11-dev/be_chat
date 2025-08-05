# Chat Backend API

Backend API cho ứng dụng chat realtime được xây dựng với NestJS, hỗ trợ authentication, WebSocket và quản lý tin nhắn.

## 🚀 Tính năng chính

### ✅ **Authentication & Authorization**
- JWT-based authentication
- Access token (10 giờ) và Refresh token (21 giờ)
- Passport JWT strategy
- Protected routes với guards

### ✅ **User Management**
- Đăng ký/Đăng nhập người dùng
- Tìm kiếm người dùng với pagination
- Quản lý profile người dùng
- Exclude current user từ danh sách

### ✅ **Chat System**
- WebSocket realtime với Socket.IO
- Gửi/nhận tin nhắn realtime
- Typing indicators
- Read status tracking
- Message recall functionality

### ✅ **Database**
- SQLite với TypeORM
- Migration system
- Entity relationships
- Data validation

## 🛠️ Công nghệ sử dụng

- **Framework**: NestJS 10.3.0
- **Database**: SQLite với TypeORM
- **WebSocket**: Socket.IO
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger
- **ORM**: TypeORM
- **Testing**: Jest

## 📦 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd backend
npm install
```

### 2. Cấu hình Environment
Tạo file `.env` từ `.env.example`:
```env
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000
PORT=8080
```

### 3. Khởi tạo Database
```bash
# Chạy migrations
npm run migration:run

# Hoặc khởi tạo database
npm run init-db
```

### 4. Chạy development server
```bash
npm run start:dev
```

Server sẽ chạy tại: `http://localhost:8080`

## 🔧 Scripts có sẵn

```bash
# Development
npm run start:dev          # Chạy với watch mode
npm run start:debug        # Chạy với debug mode

# Production
npm run build             # Build project
npm run start:prod        # Chạy production

# Database
npm run migration:generate # Tạo migration mới
npm run migration:run     # Chạy migrations
npm run migration:revert  # Revert migration cuối
npm run init-db           # Khởi tạo database

# Testing
npm run test              # Chạy unit tests
npm run test:watch        # Chạy tests với watch
npm run test:e2e          # Chạy end-to-end tests

# Code Quality
npm run lint              # ESLint
npm run format            # Prettier
```

## 📊 Cấu trúc Database

### Bảng Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  email VARCHAR,
  avatar VARCHAR,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng Messages
```sql
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY,
  content TEXT NOT NULL,
  type VARCHAR DEFAULT 'text',
  senderId INTEGER NOT NULL,
  receiverId INTEGER NOT NULL,
  isRead BOOLEAN DEFAULT false,
  isRecalled BOOLEAN DEFAULT false,
  recalledAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Đăng xuất |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Lấy danh sách users (trừ user hiện tại) |
| GET | `/users/search?q=query&limit=10` | Tìm kiếm users |
| GET | `/users/profile` | Lấy thông tin profile |
| PATCH | `/users/:id` | Cập nhật thông tin user |
| DELETE | `/users/:id` | Xóa user |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/messages` | Gửi tin nhắn mới |
| GET | `/chat/messages/:otherUserId` | Lấy tin nhắn giữa 2 users |
| GET | `/chat/messages/unread` | Lấy tin nhắn chưa đọc |
| PUT | `/chat/messages/:messageId/read` | Đánh dấu tin nhắn đã đọc |
| PUT | `/chat/messages/read/:otherUserId` | Đánh dấu tất cả tin nhắn đã đọc |
| DELETE | `/chat/messages/:messageId` | Xóa tin nhắn |
| GET | `/chat/conversations` | Lấy danh sách cuộc trò chuyện |

## 🔄 WebSocket Events

### Client → Server
- `send_message` - Gửi tin nhắn
- `join_conversation` - Tham gia cuộc trò chuyện
- `leave_conversation` - Rời cuộc trò chuyện
- `typing_start` - Bắt đầu gõ
- `typing_stop` - Dừng gõ
- `mark_as_read` - Đánh dấu đã đọc
- `recall_message` - Thu hồi tin nhắn

### Server → Client
- `new_message` - Tin nhắn mới
- `message_sent` - Tin nhắn đã gửi thành công
- `joined_conversation` - Đã tham gia cuộc trò chuyện
- `left_conversation` - Đã rời cuộc trò chuyện
- `user_typing` - User đang gõ
- `user_stopped_typing` - User dừng gõ
- `message_marked_read` - Tin nhắn đã được đánh dấu đọc
- `message_recalled` - Tin nhắn đã được thu hồi
- `error` - Lỗi

## 📁 Cấu trúc thư mục

```
src/
├── modules/
│   ├── auth/              # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   ├── users/             # User management module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   └── dto/
│   └── chat/              # Chat module
│       ├── chat.controller.ts
│       ├── chat.service.ts
│       ├── chat.gateway.ts
│       ├── entities/
│       └── dto/
├── common/                # Shared utilities
│   ├── guards/
│   ├── decorators/
│   └── interfaces/
├── database/              # Database configuration
│   ├── data-source.ts
│   └── migrations/
├── config/                # Configuration
└── main.ts               # Application entry point
```

## 🔒 Bảo mật

### JWT Configuration
- **Access Token**: 10 giờ
- **Refresh Token**: 21 giờ
- **Algorithm**: HS256
- **Secret**: Configurable via environment

### CORS Configuration
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Authentication Guards
- `JwtAuthGuard` - Bảo vệ routes yêu cầu authentication
- `LocalAuthGuard` - Bảo vệ login route

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:cov
```

## 🐛 Debug và Troubleshooting

### Kiểm tra logs
```bash
# Development mode với debug
npm run start:debug
```

### Database issues
```bash
# Reset database
rm database.sqlite
npm run migration:run
```

### WebSocket issues
- Kiểm tra CORS configuration
- Verify JWT token trong WebSocket connection
- Check Socket.IO version compatibility

## 📚 API Documentation

Swagger UI có sẵn tại: `http://localhost:8080/api`

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t chat-backend .

# Run container
docker run -p 8080:8080 chat-backend
```

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your_production_secret
FRONTEND_URL=https://your-frontend-domain.com
PORT=8080
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License

---

**Backend API Documentation** 📚 