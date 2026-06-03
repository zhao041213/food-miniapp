function toNumber(value) {
	const number = Number(value)
	return Number.isFinite(number) ? number : 0
}

function round2(value) {
	return Math.round(value * 100) / 100
}

function getDishId(dish) {
	return dish && (dish.id || dish._id)
}

function normalizeDish(dish) {
	return {
		...dish,
		id: getDishId(dish),
		price: toNumber(dish && dish.price)
	}
}

function includesAny(text, keywords) {
	return keywords.some(keyword => text.includes(keyword))
}

function parseBudget(text) {
	const match = text.match(/(\d+(?:\.\d+)?)\s*(元|块|以内|预算)?/)
	if (!match) {
		return 60
	}
	return toNumber(match[1]) || 60
}

function parseOrderRequest(input) {
	const text = String(input || '').trim()
	const keywords = []
	const intent = {
		originalText: text,
		budget: parseBudget(text),
		avoidSpicy: includesAny(text, ['不要辣', '不吃辣', '别辣', '清淡']),
		wantSpicy: includesAny(text, ['想吃辣', '来点辣', '麻辣', '香辣']),
		goal: 'balanced',
		mealType: 'any',
		keywords
	}

	if (includesAny(text, ['减脂', '减肥', '低脂', '控油', '轻食'])) {
		intent.goal = 'fat_loss'
		keywords.push('减脂')
	} else if (includesAny(text, ['增肌', '高蛋白', '蛋白', '健身'])) {
		intent.goal = 'high_protein'
		keywords.push('高蛋白')
	} else if (includesAny(text, ['吃饱', '饱腹', '顶饿'])) {
		intent.goal = 'full'
		keywords.push('饱腹')
	}

	if (includesAny(text, ['早餐', '早饭'])) {
		intent.mealType = 'breakfast'
		keywords.push('早餐')
	} else if (includesAny(text, ['午餐', '午饭', '中午'])) {
		intent.mealType = 'lunch'
		keywords.push('午餐')
	} else if (includesAny(text, ['晚餐', '晚饭', '晚上'])) {
		intent.mealType = 'dinner'
		keywords.push('晚餐')
	}

	return intent
}

function getDishText(dish) {
	return `${dish.name || ''} ${dish.category || ''} ${dish.description || ''}`
}

function isSpicyDish(dish) {
	return includesAny(getDishText(dish), ['辣', '麻', '川', '香辣'])
}

function getDishTags(dish) {
	const text = getDishText(dish)
	const tags = []

	if (includesAny(text, ['汤', '凉菜', '黄瓜', '紫菜', '青菜', '蔬', '清淡'])) {
		tags.push('light')
	}
	if (includesAny(text, ['鸡', '鱼', '牛', '虾', '蛋', '豆腐', '肉'])) {
		tags.push('protein')
	}
	if (includesAny(text, ['米饭', '面', '粉', '主食', '饭', '饼'])) {
		tags.push('carb')
	}
	if (dish.price >= 20) {
		tags.push('main')
	}
	if (isSpicyDish(dish)) {
		tags.push('spicy')
	}

	return tags
}

function filterAvailableDishes(dishes, intent) {
	if (!Array.isArray(dishes)) {
		return []
	}

	return dishes
		.filter(dish => dish && getDishId(dish) && dish.status !== 0 && dish.status !== '0')
		.map(normalizeDish)
		.filter(dish => dish.price > 0)
		.filter(dish => !intent.avoidSpicy || !isSpicyDish(dish))
}

function scoreDish(dish, intent) {
	const tags = getDishTags(dish)
	let score = 0

	if (intent.goal === 'fat_loss') {
		if (tags.includes('light')) score += 8
		if (tags.includes('protein')) score += 5
		if (tags.includes('carb')) score -= 3
		if (tags.includes('spicy')) score -= 2
	} else if (intent.goal === 'high_protein') {
		if (tags.includes('protein')) score += 9
		if (tags.includes('main')) score += 2
		if (tags.includes('light')) score += 1
	} else if (intent.goal === 'full') {
		if (tags.includes('main')) score += 5
		if (tags.includes('carb')) score += 4
		if (tags.includes('protein')) score += 3
	} else {
		if (tags.includes('protein')) score += 5
		if (tags.includes('light')) score += 4
		if (tags.includes('carb')) score += 2
	}

	if (intent.wantSpicy && tags.includes('spicy')) {
		score += 4
	}
	if (intent.mealType === 'dinner' && tags.includes('light')) {
		score += 2
	}
	if (dish.price <= intent.budget / 2) {
		score += 1
	}

	return {
		...dish,
		agentScore: score,
		agentTags: tags
	}
}

function buildReason(item, intent) {
	if (intent.goal === 'fat_loss') {
		if (item.agentTags.includes('light')) {
			return '符合减脂需求，口味相对清淡，适合控制油脂摄入。'
		}
		return '作为减脂餐的蛋白补充选择，建议搭配清淡菜品。'
	}

	if (intent.goal === 'high_protein') {
		if (item.agentTags.includes('protein')) {
			return '含蛋白食材，适合健身或增肌时补充蛋白。'
		}
		return '可以作为高蛋白餐的搭配菜品。'
	}

	if (intent.goal === 'full') {
		if (item.agentTags.includes('carb')) {
			return '主食类菜品饱腹感强，适合想吃饱的需求。'
		}
		return '价格和份量更适合作为饱腹组合的一部分。'
	}

	return '适合做荤素均衡搭配，价格也在本次预算范围内。'
}

function buildOrderPlan(scoredDishes, intent) {
	const selected = []
	let totalPrice = 0
	const sorted = scoredDishes
		.slice()
		.sort((left, right) => {
			if (right.agentScore !== left.agentScore) {
				return right.agentScore - left.agentScore
			}
			return left.price - right.price
		})

	for (const dish of sorted) {
		if (selected.length >= 3) {
			break
		}
		if (totalPrice + dish.price > intent.budget) {
			continue
		}
		selected.push({
			...dish,
			count: 1,
			reason: buildReason(dish, intent)
		})
		totalPrice += dish.price
	}

	return {
		items: selected,
		totalPrice: round2(totalPrice)
	}
}

function buildRecommendationText(intent, plan) {
	const goalText = {
		fat_loss: '减脂',
		high_protein: '高蛋白',
		full: '饱腹',
		balanced: '均衡'
	}[intent.goal] || '均衡'

	return `已按${intent.budget}元以内、${goalText}需求为你组合 ${plan.items.length} 道菜，总价约 ${plan.totalPrice} 元。`
}

function generateSmartOrderPlan(dishes, requestText) {
	const trace = []
	const intent = parseOrderRequest(requestText)
	trace.push({
		tool: 'parse_order_request',
		input: { text: requestText },
		output: intent
	})

	const candidates = filterAvailableDishes(dishes, intent)
	trace.push({
		tool: 'filter_available_dishes',
		input: { total: Array.isArray(dishes) ? dishes.length : 0 },
		output: { candidateCount: candidates.length }
	})

	if (candidates.length === 0) {
		return {
			success: false,
			message: '暂无可推荐菜品，请先确认菜品是否已上架。',
			intent,
			items: [],
			totalPrice: 0,
			recommendationText: '',
			trace
		}
	}

	const scoredDishes = candidates.map(dish => scoreDish(dish, intent))
	trace.push({
		tool: 'score_dishes',
		input: { candidateCount: candidates.length, goal: intent.goal },
		output: {
			topDishes: scoredDishes
				.slice()
				.sort((left, right) => right.agentScore - left.agentScore)
				.slice(0, 3)
				.map(dish => ({ id: dish.id, score: dish.agentScore }))
		}
	})

	const plan = buildOrderPlan(scoredDishes, intent)
	trace.push({
		tool: 'build_order_plan',
		input: { budget: intent.budget },
		output: {
			itemCount: plan.items.length,
			totalPrice: plan.totalPrice
		}
	})

	if (plan.items.length === 0) {
		return {
			success: false,
			message: '预算内暂无合适组合，可以放宽预算后重试。',
			intent,
			items: [],
			totalPrice: 0,
			recommendationText: '',
			trace
		}
	}

	return {
		success: true,
		message: '推荐已生成',
		intent,
		items: plan.items,
		totalPrice: plan.totalPrice,
		recommendationText: buildRecommendationText(intent, plan),
		trace
	}
}

module.exports = {
	parseOrderRequest,
	filterAvailableDishes,
	scoreDish,
	buildOrderPlan,
	generateSmartOrderPlan
}
