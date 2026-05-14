// 云开发 API 封装
const callCloudFunction = (name, action, data = {}) => {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: name,
			data: {
				action: action,
				data: data
			},
			success: res => {
				if (res.result.success === false) {
					reject(res.result)
				} else {
					resolve(res.result)
				}
			},
			fail: err => {
				console.error('云函数调用失败:', err)
				reject(err)
			}
		})
	})
}

// API 接口
export default {
	// 菜品相关
	dishes: {
		// 获取所有菜品
		async getAll() {
			const res = await callCloudFunction('dish', 'getAll')
			return {
				success: true,
				data: res.data
			}
		},
		// 获取单个菜品
		async getById(id) {
			const res = await callCloudFunction('dish', 'getById', { id })
			return {
				success: true,
				data: res.data
			}
		},
		// 添加菜品
		async create(data) {
			await callCloudFunction('dish', 'create', data)
			return {
				success: true,
				message: '添加成功'
			}
		},
		// 更新菜品
		async update(id, data) {
			await callCloudFunction('dish', 'update', { id, ...data })
			return {
				success: true,
				message: '更新成功'
			}
		},
		// 删除菜品
		async delete(id) {
			await callCloudFunction('dish', 'delete', { id })
			return {
				success: true,
				message: '删除成功'
			}
		}
	},

	// 订单相关
	orders: {
		// 获取所有订单
		async getAll(userId) {
			const res = await callCloudFunction('order', 'getAll', { userId })
			return {
				success: true,
				data: res.data.map(order => ({
					...order,
					id: order._id,
					createTime: order.createTime
				}))
			}
		},
		// 获取单个订单
		async getById(id) {
			const res = await callCloudFunction('order', 'getById', { id })
			return {
				success: true,
				data: res.data
			}
		},
		// 创建订单
		async create(data) {
			const res = await callCloudFunction('order', 'create', data)
			return res
		},
		// 更新订单状态
		async updateStatus(id, status) {
			await callCloudFunction('order', 'updateStatus', { id, status })
			return {
				success: true,
				message: '状态更新成功'
			}
		},
		// 删除订单
		async delete(id) {
			await callCloudFunction('order', 'delete', { id })
			return {
				success: true,
				message: '删除成功'
			}
		}
	},

	// 用户相关
	users: {
		// 登录
		async login(phone, password) {
			return await callCloudFunction('user', 'login', { phone, password })
		},
		// 注册
		async register(data) {
			return await callCloudFunction('user', 'register', data)
		},
		// 获取用户信息
		async getInfo(id) {
			return await callCloudFunction('user', 'getInfo', { id })
		}
	}
}
