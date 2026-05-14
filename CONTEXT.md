# 项目开发上下文记录

## 项目概述
微信点餐小程序 - 完整的前后端分离项目

**技术栈：**
- 前端：uni-app + Vue.js + 微信小程序
- 后端：Node.js + Express + MySQL

**项目位置：** `D:\微信点餐小程序`

## 项目结构

```
微信点餐小程序/
├── pages/                  # 前端页面
│   ├── index/             # 首页（菜品列表）
│   ├── cart/              # 购物车
│   ├── order/             # 订单列表
│   ├── mine/              # 我的
│   └── admin/             # 管理端
│       ├── admin.vue      # 菜品管理
│       └── edit/          # 菜品编辑
├── utils/                 # 工具类
│   ├── storage.js         # 本地存储
│   ├── api.js             # API 接口封装
│   └── data.js            # 旧数据管理（已废弃）
├── static/                # 静态资源
├── server/                # 后端服务
│   ├── config/           
│   │   └── database.js    # 数据库连接
│   ├── controllers/       # 控制器
│   │   ├── dishController.js
│   │   ├── orderController.js
│   │   └── userController.js
│   ├── routes/            # 路由
│   │   ├── dish.js
│   │   ├── order.js
│   │   └── user.js
│   ├── app.js             # 入口文件
│   ├── database.sql       # 数据库脚本
│   ├── package.json
│   ├── .env.example       # 配置模板
│   └── README.md          # 后端文档
├── App.vue
├── main.js
├── pages.json
├── manifest.json
├── package.json
└── README.md              # 主文档
```

## 已实现的功能

### 用户端
✅ 首页菜品展示（从数据库获取）
✅ 分类筛选（全部、热菜、凉菜、主食、汤类）
✅ 加入购物车（本地存储）
✅ 购物车管理（增减数量、删除）
✅ 提交订单（保存到数据库）
✅ 订单列表（从数据库获取）
✅ 订单状态更新（同步到数据库）
✅ 用户登录/退出（数据库验证）

### 管理端
✅ 管理员登录验证
✅ 菜品列表展示（从数据库获取）
✅ 添加菜品（保存到数据库）
✅ 编辑菜品（更新数据库）
✅ 删除菜品（从数据库删除）
✅ 权限控制（管理员才能访问）

### 后端 API
✅ 菜品接口（GET/POST/PUT/DELETE）
✅ 订单接口（GET/POST/PUT/DELETE）
✅ 用户接口（登录/注册/获取信息）
✅ 数据库连接池
✅ CORS 跨域支持
✅ 统一错误处理

## 数据库设计

### users 表（用户表）
- id: 主键
- phone: 手机号/账号
- password: 密码（明文，未加密）
- name: 用户名
- avatar: 头像
- role: 角色（user/admin）
- created_at, updated_at

### dishes 表（菜品表）
- id: 主键
- name: 菜品名称
- price: 价格（DECIMAL）
- image: 图片路径
- category: 分类
- description: 描述
- status: 状态（1-上架 0-下架）
- created_at, updated_at

### orders 表（订单表）
- id: 主键
- user_id: 用户ID（外键）
- total_price: 总价
- status: 订单状态（待上菜/已上齐）
- created_at, updated_at

### order_items 表（订单详情表）
- id: 主键
- order_id: 订单ID（外键）
- dish_id: 菜品ID（外键）
- dish_name: 菜品名称
- dish_price: 菜品价格
- count: 数量
- created_at

## 配置信息

### 小程序配置
- AppID: `wx95e0bd4dcf324804`
- 已配置在 `manifest.json`

### 后端配置
- 端口: 3001
- API 地址: `http://localhost:3001/api`
- 数据库: order_system

### 测试账号
**管理员：**
- 账号: admin
- 密码: admin123

**普通用户：**
- 账号: 13800138000
- 密码: 123456

## 数据流向

### 菜品数据流
```
管理端添加/编辑菜品 
  → API: POST/PUT /api/dishes 
  → 保存到 MySQL dishes 表
  → 用户端刷新
  → API: GET /api/dishes
  → 从数据库读取
  → 展示最新菜品
```

### 订单数据流
```
用户端加入购物车
  → 本地存储（localStorage）
  → 提交订单
  → API: POST /api/orders
  → 保存到 MySQL orders 和 order_items 表
  → 订单页面
  → API: GET /api/orders
  → 从数据库读取
  → 展示订单列表
```

### 登录数据流
```
用户输入账号密码
  → API: POST /api/users/login
  → 查询 MySQL users 表
  → 验证成功返回用户信息
  → 保存到本地存储
  → 用于权限判断
```

## 关键代码位置

### 前端 API 调用
- API 封装: `utils/api.js`
- 使用示例:
  ```javascript
  import api from '@/utils/api.js'
  const res = await api.dishes.getAll()
  ```

### 后端路由
- 菜品路由: `server/routes/dish.js`
- 订单路由: `server/routes/order.js`
- 用户路由: `server/routes/user.js`

### 后端控制器
- 菜品控制器: `server/controllers/dishController.js`
- 订单控制器: `server/controllers/orderController.js`
- 用户控制器: `server/controllers/userController.js`

### 数据库连接
- 配置文件: `server/config/database.js`
- 使用连接池，最大连接数: 10

## 启动步骤

### 1. 启动后端
```bash
cd server
npm install
# 复制 .env.example 为 .env，修改数据库密码
# 执行 database.sql 创建数据库
npm run dev
```

### 2. 启动前端
- 用 HBuilderX 打开项目
- 运行到微信开发者工具
- 关闭域名校验

## 未实现的功能

❌ 微信支付接口
❌ 图片上传功能
❌ 菜品搜索
❌ 用户收货地址
❌ JWT 认证
❌ 密码加密（bcrypt）
❌ 接口权限验证
❌ 订单打印
❌ 数据统计

## 已知问题

1. **安全性问题：**
   - 密码明文存储
   - 没有 JWT 认证
   - 没有接口权限验证
   - 任何人都可以调用管理接口

2. **功能限制：**
   - 图片只能用占位图
   - 购物车数据在本地，清除缓存会丢失
   - 没有支付功能

3. **性能问题：**
   - 没有缓存机制
   - 没有分页加载
   - 图片没有 CDN

## 优化建议

### 短期优化（1-2周）
1. 添加密码加密（bcrypt）
2. 实现 JWT 认证
3. 添加接口权限验证中间件
4. 实现图片上传功能（使用 multer）
5. 添加菜品搜索功能

### 中期优化（1个月）
1. 接入微信支付
2. 添加 Redis 缓存
3. 实现分页加载
4. 添加日志系统（Winston）
5. 添加错误监控（Sentry）

### 长期优化（2-3个月）
1. 支持多商家模式
2. 添加优惠券系统
3. 实现数据统计报表
4. 添加订单打印功能
5. 配置 CI/CD 自动部署

## 开发注意事项

1. **前端开发：**
   - 页面使用 `onShow` 刷新数据
   - API 调用使用 async/await
   - 错误要有友好提示

2. **后端开发：**
   - 所有数据库操作使用 Promise
   - 订单创建使用事务
   - 统一返回格式: `{ success: true/false, data/message }`

3. **数据库操作：**
   - 使用参数化查询防止 SQL 注入
   - 订单创建使用事务保证一致性
   - 外键约束保证数据完整性

## 文档位置

- 主文档: `README.md`
- 后端文档: `server/README.md`
- 数据库脚本: `server/database.sql`
- 本上下文文档: `CONTEXT.md`

## 最后更新

- 日期: 2026-05-07
- 状态: 基础功能已完成，可正常运行
- 下一步: 根据需求添加安全性和功能优化
