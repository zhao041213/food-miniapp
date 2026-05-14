-- 创建数据库
CREATE DATABASE IF NOT EXISTS order_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE order_system;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号/账号',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    name VARCHAR(50) NOT NULL COMMENT '用户名',
    avatar VARCHAR(255) DEFAULT '/static/avatar.png' COMMENT '头像',
    role ENUM('user', 'admin') DEFAULT 'user' COMMENT '角色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 菜品表
CREATE TABLE IF NOT EXISTS dishes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '菜品名称',
    price DECIMAL(10, 2) NOT NULL COMMENT '价格',
    image VARCHAR(255) DEFAULT '/static/dishes/placeholder.png' COMMENT '图片',
    category VARCHAR(50) NOT NULL COMMENT '分类',
    description TEXT COMMENT '描述',
    status TINYINT DEFAULT 1 COMMENT '状态 1-上架 0-下架',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜品表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT COMMENT '用户ID',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '总价',
    status VARCHAR(20) DEFAULT '待上菜' COMMENT '订单状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单详情表
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL COMMENT '订单ID',
    dish_id INT COMMENT '菜品ID',
    dish_name VARCHAR(100) NOT NULL COMMENT '菜品名称',
    dish_price DECIMAL(10, 2) NOT NULL COMMENT '菜品价格',
    count INT NOT NULL COMMENT '数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单详情表';

-- 插入默认管理员账号
INSERT INTO users (phone, password, name, role) VALUES
('admin', 'admin123', '管理员', 'admin'),
('13800138000', '123456', '用户', 'user');

-- 插入初始菜品数据
INSERT INTO dishes (name, price, image, category, description) VALUES
('宫保鸡丁', 28.00, '/static/dishes/placeholder.png', '热菜', '经典川菜，鸡肉鲜嫩，花生酥脆'),
('鱼香肉丝', 26.00, '/static/dishes/placeholder.png', '热菜', '酸甜可口，色泽红亮'),
('麻婆豆腐', 18.00, '/static/dishes/placeholder.png', '热菜', '麻辣鲜香，豆腐嫩滑'),
('西红柿炒鸡蛋', 15.00, '/static/dishes/placeholder.png', '热菜', '家常菜，营养丰富'),
('酸辣土豆丝', 12.00, '/static/dishes/placeholder.png', '凉菜', '清脆爽口，开胃下饭'),
('凉拌黄瓜', 10.00, '/static/dishes/placeholder.png', '凉菜', '清爽解腻'),
('米饭', 2.00, '/static/dishes/placeholder.png', '主食', '香软可口'),
('紫菜蛋花汤', 8.00, '/static/dishes/placeholder.png', '汤类', '营养美味');
