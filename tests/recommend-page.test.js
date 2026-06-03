const assert = require('assert')
const fs = require('fs')

const source = fs.readFileSync('pages/recommend/recommend.vue', 'utf8')

function testRecommendDishButtonAddsToCartWithoutCheckout() {
	assert.ok(
		source.includes('@click="addToCart(dish)"'),
		'Recommend dish button should call addToCart'
	)
	assert.ok(
		source.includes('加入购物车'),
		'Recommend dish button should say 加入购物车'
	)
	assert.ok(
		!source.includes('addAndCheckout'),
		'Recommend page should not use checkout action for dish button'
	)
}

function testRecommendPageUsesNamespaceImportForCommonJsHelper() {
	assert.ok(
		source.includes("import * as recommendation from '@/utils/recommendation.js'"),
		'Recommend page should use namespace import for CommonJS helper'
	)
	assert.ok(
		!source.includes("import recommendation from '@/utils/recommendation.js'"),
		'Recommend page should not use default import for CommonJS helper'
	)
}

function run() {
	testRecommendDishButtonAddsToCartWithoutCheckout()
	testRecommendPageUsesNamespaceImportForCommonJsHelper()
	console.log('recommend page tests passed')
}

run()
