function toNumber(value) {
	const number = Number(value)
	return Number.isFinite(number) ? number : 0
}

function round2(value) {
	return Math.round(value * 100) / 100
}

function assertRange(value, min, max, message) {
	if (value < min || value > max) {
		throw new Error(message)
	}
}

function classifyBmi(bmi) {
	if (bmi < 18.5) {
		return {
			type: 'underweight',
			goal: '补充能量'
		}
	}

	if (bmi < 24) {
		return {
			type: 'normal',
			goal: '均衡搭配'
		}
	}

	if (bmi < 28) {
		return {
			type: 'overweight',
			goal: '清淡控油'
		}
	}

	return {
		type: 'obese',
		goal: '轻食控量'
	}
}

function buildNutritionProfile(input) {
	const height = toNumber(input && input.height)
	const weight = toNumber(input && input.weight)
	const age = toNumber(input && input.age)

	assertRange(height, 80, 230, '请输入有效身高')
	assertRange(weight, 20, 300, '请输入有效体重')
	assertRange(age, 1, 120, '请输入有效年龄')

	const bmi = round2(weight / Math.pow(height / 100, 2))
	const classification = classifyBmi(bmi)

	return {
		height,
		weight,
		age,
		bmi,
		type: classification.type,
		goal: classification.goal,
		summary: `BMI ${bmi}，建议以${classification.goal}为主`
	}
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

function getDishTags(dish) {
	const text = `${dish.name || ''} ${dish.category || ''} ${dish.description || ''}`
	const tags = []

	if (includesAny(text, ['汤', '凉菜', '黄瓜', '紫菜', '青菜', '蔬', '清淡'])) {
		tags.push('light')
	}
	if (includesAny(text, ['鸡', '鱼', '牛', '虾', '蛋', '豆腐', '肉'])) {
		tags.push('protein')
	}
	if (includesAny(text, ['米饭', '面', '粉', '主食', '饼', '饭'])) {
		tags.push('carb')
	}
	if (dish.price >= 20) {
		tags.push('energy')
	}

	return tags
}

function scoreDish(dish, profile) {
	const tags = getDishTags(dish)
	let score = 0

	if (profile.type === 'underweight') {
		if (tags.includes('protein')) score += 6
		if (tags.includes('energy')) score += 3
		if (tags.includes('carb')) score += 2
		if (tags.includes('light')) score -= 1
	} else if (profile.type === 'overweight' || profile.type === 'obese') {
		if (tags.includes('light')) score += 6
		if (tags.includes('protein')) score += 2
		if (tags.includes('carb')) score -= 4
		if (profile.type === 'obese' && tags.includes('energy')) score -= 2
	} else {
		if (tags.includes('protein')) score += 4
		if (tags.includes('light')) score += 3
		if (tags.includes('carb')) score += 1
	}

	if (profile.age >= 60 && tags.includes('light')) {
		score += 2
	}

	return {
		score,
		tags
	}
}

function buildReason(dish, profile, tags) {
	if (profile.type === 'underweight') {
		if (tags.includes('protein')) {
			return `你的 BMI ${profile.bmi} 偏低，这道菜含蛋白食材，适合作为补充能量的选择。`
		}
		return `你的 BMI ${profile.bmi} 偏低，这道菜可以帮助补充日常能量。`
	}

	if (profile.type === 'overweight' || profile.type === 'obese') {
		if (tags.includes('light')) {
			return `你的 BMI ${profile.bmi} 偏高，这道菜相对清淡，适合控油控量时选择。`
		}
		return `你的 BMI ${profile.bmi} 偏高，这道菜可以搭配清淡菜品一起控制总量。`
	}

	if (profile.age >= 60 && tags.includes('light')) {
		return `你的 BMI ${profile.bmi} 处于正常范围，这道菜清淡易搭配，适合日常均衡饮食。`
	}

	return `你的 BMI ${profile.bmi} 处于正常范围，这道菜适合做荤素均衡搭配。`
}

function recommendNutritionDishes(dishes, profile, count = 3) {
	if (!Array.isArray(dishes)) {
		return []
	}

	return dishes
		.filter(dish => dish && getDishId(dish) && dish.status !== 0 && dish.status !== '0')
		.map(normalizeDish)
		.map((dish, index) => {
			const scored = scoreDish(dish, profile)
			return {
				...dish,
				score: scored.score,
				reason: buildReason(dish, profile, scored.tags),
				nutritionTags: scored.tags,
				_originalIndex: index
			}
		})
		.sort((left, right) => {
			if (right.score !== left.score) {
				return right.score - left.score
			}
			return left._originalIndex - right._originalIndex
		})
		.slice(0, count)
		.map(({ _originalIndex, ...dish }) => dish)
}

module.exports = {
	buildNutritionProfile,
	recommendNutritionDishes,
	getDishTags
}
