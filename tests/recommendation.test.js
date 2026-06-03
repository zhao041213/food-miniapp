const assert = require('assert')
const recommendation = require('../utils/recommendation.js')

function testPickRecommendedDishesReturnsUniqueActiveDishes() {
	const dishes = [
		{ _id: 'dish-1', name: 'A', price: '12', status: 1 },
		{ _id: 'dish-2', name: 'B', price: 18, status: 0 },
		{ _id: 'dish-3', name: 'C', price: 22, status: 1 },
		{ id: 'dish-4', name: 'D', price: 8, status: 1 }
	]

	const result = recommendation.pickRecommendedDishes(dishes, 3, () => 0)

	assert.deepStrictEqual(result.map(dish => dish.id), ['dish-1', 'dish-3', 'dish-4'])
	assert.strictEqual(result[0].price, 12)
	assert.strictEqual(new Set(result.map(dish => dish.id)).size, result.length)
}

function testPickRecommendedDishesLimitsToAvailableDishes() {
	const result = recommendation.pickRecommendedDishes([
		{ _id: 'dish-1', name: 'A', price: 12, status: 1 }
	], 3, () => 0.8)

	assert.strictEqual(result.length, 1)
	assert.strictEqual(result[0].id, 'dish-1')
}

function testAddDishToCartAddsNewDish() {
	const cart = recommendation.addDishToCart([], {
		_id: 'dish-1',
		name: 'A',
		price: '12.5',
		image: '/static/a.jpg'
	})

	assert.deepStrictEqual(cart, [{
		_id: 'dish-1',
		id: 'dish-1',
		name: 'A',
		price: 12.5,
		image: '/static/a.jpg',
		count: 1
	}])
}

function testAddDishToCartIncrementsExistingDish() {
	const cart = recommendation.addDishToCart([
		{ id: 'dish-1', name: 'A', price: 12, count: 2 }
	], {
		_id: 'dish-1',
		name: 'A',
		price: 12
	})

	assert.deepStrictEqual(cart, [
		{ id: 'dish-1', name: 'A', price: 12, count: 3 }
	])
}

function run() {
	testPickRecommendedDishesReturnsUniqueActiveDishes()
	testPickRecommendedDishesLimitsToAvailableDishes()
	testAddDishToCartAddsNewDish()
	testAddDishToCartIncrementsExistingDish()
	console.log('recommendation tests passed')
}

run()
