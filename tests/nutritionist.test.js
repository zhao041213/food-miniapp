const assert = require('assert')
const nutritionist = require('../utils/nutritionist.js')

function testBuildNutritionProfileClassifiesOverweightUser() {
	const profile = nutritionist.buildNutritionProfile({
		height: 170,
		weight: 80,
		age: 35
	})

	assert.strictEqual(profile.bmi, 27.68)
	assert.strictEqual(profile.type, 'overweight')
	assert.strictEqual(profile.goal, '清淡控油')
	assert.ok(profile.summary.includes('BMI 27.68'))
}

function testBuildNutritionProfileClassifiesUnderweightUser() {
	const profile = nutritionist.buildNutritionProfile({
		height: 175,
		weight: 50,
		age: 22
	})

	assert.strictEqual(profile.type, 'underweight')
	assert.strictEqual(profile.goal, '补充能量')
}

function testRecommendNutritionDishesPrefersLightDishesForOverweightUser() {
	const dishes = [
		{ _id: 'dish-1', name: '米饭', category: '主食', price: 2, status: 1 },
		{ _id: 'dish-2', name: '紫菜蛋花汤', category: '汤类', price: 8, status: 1 },
		{ _id: 'dish-3', name: '宫保鸡丁', category: '热菜', price: 28, status: 1 }
	]
	const profile = nutritionist.buildNutritionProfile({
		height: 170,
		weight: 80,
		age: 35
	})

	const result = nutritionist.recommendNutritionDishes(dishes, profile, 2)

	assert.deepStrictEqual(result.map(item => item.id), ['dish-2', 'dish-3'])
	assert.ok(result[0].reason.includes('清淡'))
	assert.ok(result[0].reason.includes('BMI'))
	assert.strictEqual(result[0].price, 8)
}

function testRecommendNutritionDishesIncludesProteinReasonForUnderweightUser() {
	const dishes = [
		{ _id: 'dish-1', name: '凉拌黄瓜', category: '凉菜', price: 10, status: 1 },
		{ _id: 'dish-2', name: '鸡肉豆腐煲', category: '热菜', price: 32, status: 1 },
		{ _id: 'dish-3', name: '米饭', category: '主食', price: 2, status: 1 }
	]
	const profile = nutritionist.buildNutritionProfile({
		height: 175,
		weight: 50,
		age: 22
	})

	const result = nutritionist.recommendNutritionDishes(dishes, profile, 2)

	assert.strictEqual(result[0].id, 'dish-2')
	assert.ok(result[0].reason.includes('蛋白'))
}

function testRejectsInvalidProfileInput() {
	assert.throws(
		() => nutritionist.buildNutritionProfile({ height: 0, weight: 70, age: 30 }),
		/请输入有效身高/
	)
	assert.throws(
		() => nutritionist.buildNutritionProfile({ height: 170, weight: 0, age: 30 }),
		/请输入有效体重/
	)
	assert.throws(
		() => nutritionist.buildNutritionProfile({ height: 170, weight: 70, age: 0 }),
		/请输入有效年龄/
	)
}

function run() {
	testBuildNutritionProfileClassifiesOverweightUser()
	testBuildNutritionProfileClassifiesUnderweightUser()
	testRecommendNutritionDishesPrefersLightDishesForOverweightUser()
	testRecommendNutritionDishesIncludesProteinReasonForUnderweightUser()
	testRejectsInvalidProfileInput()
	console.log('nutritionist tests passed')
}

run()
