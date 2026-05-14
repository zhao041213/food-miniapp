import storage from './storage.js'

// 初始化菜品数据
const initDishes = [
	{
		id: 1,
		name: '宫保鸡丁',
		price: 28,
		image: '/static/dishes/placeholder.png',
		category: '热菜',
		description: '经典川菜，鸡肉鲜嫩，花生酥脆'
	},
	{
		id: 2,
		name: '鱼香肉丝',
		price: 26,
		image: '/static/dishes/placeholder.png',
		category: '热菜',
		description: '酸甜可口，色泽红亮'
	},
	{
		id: 3,
		name: '麻婆豆腐',
		price: 18,
		image: '/static/dishes/placeholder.png',
		category: '热菜',
		description: '麻辣鲜香，豆腐嫩滑'
	},
	{
		id: 4,
		name: '西红柿炒鸡蛋',
		price: 15,
		image: '/static/dishes/placeholder.png',
		category: '热菜',
		description: '家常菜，营养丰富'
	},
	{
		id: 5,
		name: '酸辣土豆丝',
		price: 12,
		image: '/static/dishes/placeholder.png',
		category: '凉菜',
		description: '清脆爽口，开胃下饭'
	},
	{
		id: 6,
		name: '凉拌黄瓜',
		price: 10,
		image: '/static/dishes/placeholder.png',
		category: '凉菜',
		description: '清爽解腻'
	},
	{
		id: 7,
		name: '米饭',
		price: 2,
		image: '/static/dishes/placeholder.png',
		category: '主食',
		description: '香软可口'
	},
	{
		id: 8,
		name: '紫菜蛋花汤',
		price: 8,
		image: '/static/dishes/placeholder.png',
		category: '汤类',
		description: '营养美味'
	}
]

// 数据管理类
export default {
	// 初始化数据
	init() {
		if (!storage.get('dishes')) {
			storage.set('dishes', initDishes)
		}
		if (!storage.get('orders')) {
			storage.set('orders', [])
		}
		if (!storage.get('cart')) {
			storage.set('cart', [])
		}
	},

	// 获取所有菜品
	getDishes() {
		return storage.get('dishes') || []
	},

	// 添加菜品
	addDish(dish) {
		const dishes = this.getDishes()
		dish.id = Date.now()
		dishes.push(dish)
		storage.set('dishes', dishes)
		return dish
	},

	// 更新菜品
	updateDish(dish) {
		const dishes = this.getDishes()
		const index = dishes.findIndex(d => d.id === dish.id)
		if (index !== -1) {
			dishes[index] = dish
			storage.set('dishes', dishes)
			return true
		}
		return false
	},

	// 删除菜品
	deleteDish(id) {
		const dishes = this.getDishes()
		const newDishes = dishes.filter(d => d.id !== id)
		storage.set('dishes', newDishes)
	},

	// 获取购物车
	getCart() {
		return storage.get('cart') || []
	},

	// 添加到购物车
	addToCart(dish) {
		const cart = this.getCart()
		const existItem = cart.find(item => item.id === dish.id)
		if (existItem) {
			existItem.count++
		} else {
			cart.push({...dish, count: 1})
		}
		storage.set('cart', cart)
	},

	// 更新购物车商品数量
	updateCartCount(dishId, count) {
		const cart = this.getCart()
		const item = cart.find(item => item.id === dishId)
		if (item) {
			if (count <= 0) {
				this.removeFromCart(dishId)
			} else {
				item.count = count
				storage.set('cart', cart)
			}
		}
	},

	// 从购物车移除
	removeFromCart(dishId) {
		const cart = this.getCart()
		const newCart = cart.filter(item => item.id !== dishId)
		storage.set('cart', newCart)
	},

	// 清空购物车
	clearCart() {
		storage.set('cart', [])
	},

	// 获取订单列表
	getOrders() {
		return storage.get('orders') || []
	},

	// 创建订单
	createOrder(cartItems) {
		const orders = this.getOrders()
		const order = {
			id: Date.now(),
			items: cartItems,
			totalPrice: cartItems.reduce((sum, item) => sum + item.price * item.count, 0),
			status: '待上菜', // 待上菜、已上齐
			createTime: new Date().toLocaleString()
		}
		orders.unshift(order)
		storage.set('orders', orders)
		this.clearCart()
		return order
	},

	// 更新订单状态
	updateOrderStatus(orderId, status) {
		const orders = this.getOrders()
		const order = orders.find(o => o.id === orderId)
		if (order) {
			order.status = status
			storage.set('orders', orders)
		}
	}
}
