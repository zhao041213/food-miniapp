const db = require('../config/database');

// 获取所有菜品
exports.getAllDishes = async (req, res) => {
	try {
		const [rows] = await db.query('SELECT * FROM dishes WHERE status = 1 ORDER BY id DESC');
		res.json({
			success: true,
			data: rows
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '获取菜品失败',
			error: error.message
		});
	}
};

// 获取单个菜品
exports.getDishById = async (req, res) => {
	try {
		const { id } = req.params;
		const [rows] = await db.query('SELECT * FROM dishes WHERE id = ?', [id]);

		if (rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: '菜品不存在'
			});
		}

		res.json({
			success: true,
			data: rows[0]
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '获取菜品失败',
			error: error.message
		});
	}
};

// 添加菜品
exports.createDish = async (req, res) => {
	try {
		const { name, price, image, category, description } = req.body;

		if (!name || !price || !category) {
			return res.status(400).json({
				success: false,
				message: '缺少必填字段'
			});
		}

		const [result] = await db.query(
			'INSERT INTO dishes (name, price, image, category, description) VALUES (?, ?, ?, ?, ?)',
			[name, price, image || '/static/dishes/placeholder.png', category, description]
		);

		res.json({
			success: true,
			message: '添加成功',
			data: {
				id: result.insertId,
				name,
				price,
				image: image || '/static/dishes/placeholder.png',
				category,
				description
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '添加菜品失败',
			error: error.message
		});
	}
};

// 更新菜品
exports.updateDish = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, price, image, category, description, status } = req.body;

		const [result] = await db.query(
			'UPDATE dishes SET name = ?, price = ?, image = ?, category = ?, description = ?, status = ? WHERE id = ?',
			[name, price, image, category, description, status !== undefined ? status : 1, id]
		);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: '菜品不存在'
			});
		}

		res.json({
			success: true,
			message: '更新成功'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '更新菜品失败',
			error: error.message
		});
	}
};

// 删除菜品
exports.deleteDish = async (req, res) => {
	try {
		const { id } = req.params;

		const [result] = await db.query('DELETE FROM dishes WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: '菜品不存在'
			});
		}

		res.json({
			success: true,
			message: '删除成功'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '删除菜品失败',
			error: error.message
		});
	}
};
