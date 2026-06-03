const assert = require('assert')
const fs = require('fs')

const recommendSource = fs.readFileSync('pages/recommend/recommend.vue', 'utf8')
const pagesConfig = fs.readFileSync('pages.json', 'utf8')
const appConfig = fs.readFileSync('app.json', 'utf8')

function testRecommendPageContainsNutritionistEntry() {
	assert.ok(
		recommendSource.includes('goToNutritionist'),
		'AI recommend page should expose a nutritionist entry action'
	)
	assert.ok(
		recommendSource.includes('/pages/nutritionist/nutritionist'),
		'AI recommend page should navigate to nutritionist page'
	)
	assert.ok(
		recommendSource.includes('AI营养师'),
		'AI recommend page should label the entry AI营养师'
	)
}

function testNutritionistPageIsRegistered() {
	assert.ok(
		pagesConfig.includes('"path": "pages/nutritionist/nutritionist"'),
		'pages.json should register the nutritionist page'
	)
	assert.ok(
		appConfig.includes('"pages/nutritionist/nutritionist"'),
		'app.json should register the nutritionist page'
	)
}

function run() {
	testRecommendPageContainsNutritionistEntry()
	testNutritionistPageIsRegistered()
	console.log('nutritionist page tests passed')
}

run()
