const db = require('../config/database');

// 获取所有订单
exports.getAllOrders = async (req, res) => {
	try {
		const { userId } = req.query;

		let query = `
			SELECT o.*,
				GROUP_CONCAT(
					JSON_OBJECT(
						'id', oi.id,
						'dish_id', oi.dish_id,
						'dish_name', oi.dish_name,
						'dish_price', oi.dish_price,
						'count', oi.count
					)
				) as items
			FROM orders o
			LEFT JOIN order_items oi ON o.id = oi.order_id
		`;

		const params = [];
		if (userId) {
			query += ' WHERE o.user_id = ?';
			params.push(userId);
		}

		query += ' GROUP BY o.id ORDER BY o.created_at DESC';

		const [rows] = await db.query(query, params);

		// 解析 items JSON
		const orders = rows.map(order => ({
			...order,
			items: order.items ? JSON.parse(`[${order.items}]`) : []
		}));

		res.json({
			success: true,
			data: orders
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '获取订单失败',
			error: error.message
		});
	}
};

// 获取单个订单
exports.getOrderById = async (req, res) => {
	try {
		const { id } = req.params;

		const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);

		if (orders.length === 0) {
			return res.status(404).json({
				success: false,
				message: '订单不存在'
			});
		}

		const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

		res.json({
			success: true,
			data: {
				...orders[0],
				items
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '获取订单失败',
			error: error.message
		});
	}
};

// 创建订单
exports.createOrder = async (req, res) => {
	const connection = await db.getConnection();

	try {
		await connection.beginTransaction();

		const { userId, items, totalPrice } = req.body;

		if (!items || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: '订单不能为空'
			});
		}

		// 创建订单
		const [orderResult] = await connection.query(
			'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
			[userId || null, totalPrice, '待上菜']
		);

		const orderId = orderResult.insertId;

		// 创建订单详情
		for (const item of items) {
			await connection.query(
				'INSERT INTO order_items (order_id, dish_id, dish_name, dish_price, count) VALUES (?, ?, ?, ?, ?)',
				[orderId, item.id, item.name, item.price, item.count]
			);
		}

		await connection.commit();

		res.json({
			success: true,
			message: '订单创建成功',
			data: {
				id: orderId,
				userId,
				totalPrice,
				status: '待上菜',
				items
			}
		});
	} catch (error) {
		await connection.rollback();
		res.status(500).json({
			success: false,
			message: '创建订单失败',
			error: error.message
		});
	} finally {
		connection.release();
	}
};

// 更新订单状态
exports.updateOrderStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		const [result] = await db.query(
			'UPDATE orders SET status = ? WHERE id = ?',
			[status, id]
		);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: '订单不存在'
			});
		}

		res.json({
			success: true,
			message: '状态更新成功'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '更新订单状态失败',
			error: error.message
		});
	}
};

// 删除订单
exports.deleteOrder = async (req, res) => {
	try {
		const { id } = req.params;

		const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: '订单不存在'
			});
		}

		res.json({
			success: true,
			message: '删除成功'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: '删除订单失败',
			error: error.message
		});
	}
};
