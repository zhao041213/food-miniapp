const assert = require('assert')
const fs = require('fs')

const recommendSource = fs.readFileSync('pages/recommend/recommend.vue', 'utf8')
const pagesConfig = fs.readFileSync('pages.json', 'utf8')
const appConfig = fs.readFileSync('app.json', 'utf8')

function testRecommendPageContainsSmartAgentEntry() {
	assert.ok(
		recommendSource.includes('goToSmartOrderAgent'),
		'AI recommend page should expose smart order agent action'
	)
	assert.ok(
		recommendSource.includes('/pages/smart-order/smart-order'),
		'AI recommend page should navigate to smart order agent page'
	)
	assert.ok(
		recommendSource.includes('智能点餐 Agent'),
		'AI recommend page should label the entry 智能点餐 Agent'
	)
}

function testSmartOrderPageIsRegistered() {
	assert.ok(
		pagesConfig.includes('"path": "pages/smart-order/smart-order"'),
		'pages.json should register smart order agent page'
	)
	assert.ok(
		appConfig.includes('"pages/smart-order/smart-order"'),
		'app.json should register smart order agent page'
	)
}

function testSmartOrderPageUsesAgentHelper() {
	assert.ok(
		fs.existsSync('pages/smart-order/smart-order.vue'),
		'smart order page should exist'
	)
	const source = fs.readFileSync('pages/smart-order/smart-order.vue', 'utf8')
	assert.ok(
		source.includes("import * as smartOrderAgent from '@/utils/smartOrderAgent.js'"),
		'smart order page should use smart order agent helper'
	)
	assert.ok(
		source.includes('tool trace') || source.includes('trace-list'),
		'smart order page should display agent trace'
	)
}

function run() {
	testRecommendPageContainsSmartAgentEntry()
	testSmartOrderPageIsRegistered()
	testSmartOrderPageUsesAgentHelper()
	console.log('smart order page tests passed')
}

run()
