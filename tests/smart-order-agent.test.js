const assert = require('assert')
const agent = require('../utils/smartOrderAgent.js')

function testParseOrderRequestExtractsBudgetAndConstraints() {
	const intent = agent.parseOrderRequest('我想吃一份50元以内，不要辣，适合减脂的晚餐')

	assert.strictEqual(intent.budget, 50)
	assert.strictEqual(intent.avoidSpicy, true)
	assert.strictEqual(intent.goal, 'fat_loss')
	assert.strictEqual(intent.mealType, 'dinner')
	assert.deepStrictEqual(intent.keywords, ['减脂', '晚餐'])
}

function testGenerateSmartOrderPlanKeepsWithinBudgetAndAvoidsSpicyDishes() {
	const dishes = [
		{ _id: 'dish-1', name: '麻辣鸡丁', category: '热菜', description: '麻辣下饭', price: 28, status: 1 },
		{ _id: 'dish-2', name: '紫菜蛋花汤', category: '汤类', description: '清淡', price: 8, status: 1 },
		{ _id: 'dish-3', name: '鸡肉豆腐煲', category: '热菜', description: '高蛋白', price: 32, status: 1 },
		{ _id: 'dish-4', name: '米饭', category: '主食', description: '主食', price: 2, status: 1 }
	]

	const result = agent.generateSmartOrderPlan(dishes, '50元以内，不要辣，适合减脂的晚餐')

	assert.ok(result.success)
	assert.ok(result.totalPrice <= 50)
	assert.ok(!result.items.some(item => item.name.includes('麻辣')))
	assert.ok(result.items.length >= 2)
	assert.ok(result.recommendationText.includes('50元以内'))
	assert.ok(result.items[0].reason.includes('减脂'))
}

function testGenerateSmartOrderPlanExposesToolTrace() {
	const dishes = [
		{ _id: 'dish-1', name: '紫菜蛋花汤', category: '汤类', description: '清淡', price: 8, status: 1 },
		{ _id: 'dish-2', name: '米饭', category: '主食', description: '主食', price: 2, status: 1 }
	]

	const result = agent.generateSmartOrderPlan(dishes, '20元以内来点清淡的')

	assert.deepStrictEqual(result.trace.map(step => step.tool), [
		'parse_order_request',
		'filter_available_dishes',
		'score_dishes',
		'build_order_plan'
	])
	assert.strictEqual(result.trace[0].output.budget, 20)
	assert.strictEqual(result.trace[3].output.itemCount, result.items.length)
}

function testGenerateSmartOrderPlanReportsNoMatch() {
	const result = agent.generateSmartOrderPlan([], '50元以内')

	assert.strictEqual(result.success, false)
	assert.strictEqual(result.items.length, 0)
	assert.ok(result.message.includes('暂无可推荐菜品'))
}

function run() {
	testParseOrderRequestExtractsBudgetAndConstraints()
	testGenerateSmartOrderPlanKeepsWithinBudgetAndAvoidsSpicyDishes()
	testGenerateSmartOrderPlanExposesToolTrace()
	testGenerateSmartOrderPlanReportsNoMatch()
	console.log('smart order agent tests passed')
}

run()
