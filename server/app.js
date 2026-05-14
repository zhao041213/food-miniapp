const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
const dishRoutes = require('./routes/dish');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/user');

app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', message: '服务运行正常' });
});

// 错误处理
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		success: false,
		message: '服务器错误',
		error: err.message
	});
});

// 启动服务
app.listen(PORT, () => {
	console.log(`服务器运行在 http://localhost:${PORT}`);
});
