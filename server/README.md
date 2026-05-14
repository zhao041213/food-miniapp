# 微信点餐小程序 - 后端服务

基于 Node.js + Express + MySQL 的后端 API 服务。

## 技术栈

- Node.js
- Express
- MySQL 2
- CORS

## 安装步骤

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置数据库

复制 `.env.example` 为 `.env` 并修改数据库配置：

**Windows 用户：**
- 在 `server` 文件夹中，复制 `.env.example` 文件，重命名为 `.env`
- 或使用 PowerShell：`Copy-Item .env.example .env`

**Mac/Linux 用户：**
```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=order_system

PORT=3001
```

### 3. 创建数据库

在 MySQL 中执行 `database.sql` 文件：

```bash
mysql -u root -p < database.sql
```

或者在 MySQL 客户端中直接执行 `database.sql` 的内容。

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将运行在 `http://localhost:3001`

## API 接口文档

### 菜品接口

#### 获取所有菜品
- **GET** `/api/dishes`
- 响应：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "宫保鸡丁",
      "price": 28.00,
      "image": "/static/dishes/placeholder.png",
      "category": "热菜",
      "description": "经典川菜，鸡肉鲜嫩，花生酥脆",
      "status": 1
    }
  ]
}
```

#### 获取单个菜品
- **GET** `/api/dishes/:id`

#### 添加菜品
- **POST** `/api/dishes`
- 请求体：
```json
{
  "name": "菜品名称",
  "price": 28.00,
  "image": "/static/dishes/placeholder.png",
  "category": "热菜",
  "description": "菜品描述"
}
```

#### 更新菜品
- **PUT** `/api/dishes/:id`
- 请求体：同添加菜品

#### 删除菜品
- **DELETE** `/api/dishes/:id`

### 订单接口

#### 获取所有订单
- **GET** `/api/orders`
- 查询参数：`userId`（可选）

#### 获取单个订单
- **GET** `/api/orders/:id`

#### 创建订单
- **POST** `/api/orders`
- 请求体：
```json
{
  "userId": 1,
  "items": [
    {
      "id": 1,
      "name": "宫保鸡丁",
      "price": 28.00,
      "count": 2
    }
  ],
  "totalPrice": 56.00
}
```

#### 更新订单状态
- **PUT** `/api/orders/:id/status`
- 请求体：
```json
{
  "status": "已上齐"
}
```

#### 删除订单
- **DELETE** `/api/orders/:id`

### 用户接口

#### 用户登录
- **POST** `/api/users/login`
- 请求体：
```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

#### 用户注册
- **POST** `/api/users/register`
- 请求体：
```json
{
  "phone": "13800138000",
  "password": "123456",
  "name": "用户名"
}
```

#### 获取用户信息
- **GET** `/api/users/:id`

## 数据库表结构

### users（用户表）
- id: 主键
- phone: 手机号/账号
- password: 密码
- name: 用户名
- avatar: 头像
- role: 角色（user/admin）

### dishes（菜品表）
- id: 主键
- name: 菜品名称
- price: 价格
- image: 图片
- category: 分类
- description: 描述
- status: 状态（1-上架 0-下架）

### orders（订单表）
- id: 主键
- user_id: 用户ID
- total_price: 总价
- status: 订单状态
- created_at: 创建时间

### order_items（订单详情表）
- id: 主键
- order_id: 订单ID
- dish_id: 菜品ID
- dish_name: 菜品名称
- dish_price: 菜品价格
- count: 数量

## 默认账号

数据库初始化后会自动创建以下账号：

**管理员：**
- 账号：admin
- 密码：admin123

**普通用户：**
- 账号：13800138000
- 密码：123456

## 注意事项

1. 确保 MySQL 服务已启动
2. 确保数据库配置正确
3. 端口 3001 未被占用
4. 前端需要配置正确的 API 地址

## 开发建议

- 使用 `nodemon` 进行开发，代码修改后自动重启
- 生产环境建议使用 PM2 管理进程
- 建议添加日志系统
- 建议添加 JWT 认证
