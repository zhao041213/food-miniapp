function getDishId(dish) {
	return dish && (dish.id || dish._id)
}

function normalizePrice(value) {
	const price = Number(value)
	return Number.isFinite(price) && price >= 0 ? price : 0
}

function normalizeDish(dish) {
	if (!dish) {
		throw new Error('Dish is required')
	}

	const id = getDishId(dish)
	if (!id) {
		throw new Error('Dish id is required')
	}

	return {
		...dish,
		id,
		price: normalizePrice(dish.price)
	}
}

function isAvailableDish(dish) {
	return Boolean(dish && getDishId(dish) && dish.status !== 0 && dish.status !== '0')
}

function pickRecommendedDishes(dishes, count = 3, random = Math.random) {
	if (!Array.isArray(dishes) || count <= 0) {
		return []
	}

	const pool = dishes
		.filter(isAvailableDish)
		.map(normalizeDish)
	const limit = Math.min(Number(count) || 0, pool.length)
	const result = []

	while (result.length < limit && pool.length > 0) {
		const rawIndex = Math.floor(random() * pool.length)
		const index = Math.max(0, Math.min(rawIndex, pool.length - 1))
		result.push(pool.splice(index, 1)[0])
	}

	return result
}

function addDishToCart(cart, dish) {
	const normalizedDish = normalizeDish(dish)
	const nextCart = Array.isArray(cart)
		? cart.map(item => ({ ...item }))
		: []
	const existItem = nextCart.find(item => getDishId(item) === normalizedDish.id)

	if (existItem) {
		existItem.count = Number(existItem.count || 0) + 1
		return nextCart
	}

	nextCart.push({
		...normalizedDish,
		count: 1
	})
	return nextCart
}

module.exports = {
	getDishId,
	normalizeDish,
	pickRecommendedDishes,
	addDishToCart
}
