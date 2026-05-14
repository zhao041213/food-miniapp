const db = require('../config/database');

// 用户登录
exports.login = async (req, res) => {
	try {
		const { phone, password } = req.body;

		if (!phone || !password) {
			return res.status(400).json({
				success: false,
				message: '账号和密码不能为空'
			});
		}

		const [rows] = await db.query(
			'SELECT id, phone, name, avatar, role FROM users WHERE phone = ? AND password = ?',
			[phone, password]
		);

		if (rows.length === 0) {
			return res.status(401).json({
				success: false,
				message: '账号或密码错误'
			});
		}

		res.json({
			success: true,
			message: '登录成功',
			data: rows[0]
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '登录失败',
			error: error.message
		});
	}
};

// 用户注册
exports.register = async (req, res) => {
	try {
		const { phone, password, name } = req.body;

		if (!phone || !password || !name) {
			return res.status(400).json({
				success: false,
				message: '缺少必填字段'
			});
		}

		// 检查手机号是否已存在
		const [existing] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);

		if (existing.length > 0) {
			return res.status(400).json({
				success: false,
				message: '该手机号已注册'
			});
		}

		const [result] = await db.query(
			'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)',
			[phone, password, name, 'user']
		);

		res.json({
			success: true,
			message: '注册成功',
			data: {
				id: result.insertId,
				phone,
				name,
				role: 'user'
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '注册失败',
			error: error.message
		});
	}
};

// 获取用户信息
exports.getUserInfo = async (req, res) => {
	try {
		const { id } = req.params;

		const [rows] = await db.query(
			'SELECT id, phone, name, avatar, role FROM users WHERE id = ?',
			[id]
		);

		if (rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: '用户不存在'
			});
		}

		res.json({
			success: true,
			data: rows[0]
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '获取用户信息失败',
			error: error.message
		});
	}
};
