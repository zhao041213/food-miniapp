<template>
	<view class="container">
		<view class="hero">
			<view class="eyebrow">ORDER AGENT</view>
			<view class="title">智能点餐 Agent</view>
			<view class="subtitle">输入预算、口味和目标，Agent 自动组合菜品</view>
		</view>

		<view class="input-panel">
			<textarea
				class="agent-input"
				v-model="requestText"
				placeholder="例如：我想吃一份50元以内，不要辣，适合减脂的晚餐"
				maxlength="120"
			/>
			<button class="primary-btn" :disabled="loading" @click="runAgent">
				生成点餐方案
			</button>
		</view>

		<view v-if="plan && plan.success" class="summary-panel">
			<view class="summary-title">推荐方案</view>
			<view class="summary-text">{{ plan.recommendationText }}</view>
			<view class="summary-meta">
				<text>预算：¥{{ plan.intent.budget }}</text>
				<text>总价：¥{{ plan.totalPrice }}</text>
			</view>
		</view>

		<view v-if="plan && !plan.success" class="state">
			<view class="state-title">{{ plan.message }}</view>
		</view>

		<view v-if="plan && plan.items.length > 0" class="dish-list">
			<view v-for="dish in plan.items" :key="dish.id" class="dish-item">
				<image
					v-if="dish.image"
					:src="dish.image"
					class="dish-image"
					mode="aspectFill"
				></image>
				<view v-else class="dish-image placeholder">
					<text>AI</text>
				</view>
				<view class="dish-info">
					<view class="dish-name">{{ dish.name }}</view>
					<view class="dish-reason">{{ dish.reason }}</view>
					<view class="dish-price">¥{{ dish.price }}</view>
				</view>
			</view>
			<button class="confirm-btn" @click="confirmAddToCart">确认加入购物车</button>
		</view>

		<view v-if="trace.length > 0" class="trace-panel">
			<view class="trace-title">tool trace</view>
			<view class="trace-list">
				<view v-for="(step, index) in trace" :key="step.tool" class="trace-item">
					<view class="trace-index">{{ index + 1 }}</view>
					<view class="trace-body">
						<view class="trace-tool">{{ step.tool }}</view>
						<view class="trace-output">{{ formatTraceOutput(step.output) }}</view>
					</view>
				</view>
			</view>
		</view>

		<view class="cart-bar" @click="goToCart">
			<view class="cart-info">
				<view class="cart-icon">购</view>
				<view>
					<view class="cart-count">{{ cartCount }} 件</view>
					<view class="cart-price">¥{{ totalPrice }}</view>
				</view>
			</view>
			<view class="cart-btn">去结算</view>
		</view>
	</view>
</template>

<script>
import api from '@/utils/api.js'
import storage from '@/utils/storage.js'
import * as recommendation from '@/utils/recommendation.js'
import * as smartOrderAgent from '@/utils/smartOrderAgent.js'

export default {
	data() {
		return {
			requestText: '50元以内，不要辣，适合减脂的晚餐',
			dishes: [],
			plan: null,
			trace: [],
			cart: [],
			loading: false
		}
	},
	computed: {
		cartCount() {
			return this.cart.reduce((sum, item) => sum + Number(item.count || 0), 0)
		},
		totalPrice() {
			const total = this.cart.reduce((sum, item) => {
				return sum + Number(item.price || 0) * Number(item.count || 0)
			}, 0)
			return Math.round(total * 100) / 100
		}
	},
	onLoad() {
		this.loadDishes()
	},
	onShow() {
		this.loadCart()
	},
	methods: {
		async loadDishes() {
			this.loading = true
			try {
				const res = await api.dishes.getAll(false)
				if (res.success) {
					this.dishes = res.data.map(dish => ({
						...dish,
						id: dish.id || dish._id
					}))
				}
			} catch (error) {
				console.error('获取智能点餐菜品失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.loadCart()
			}
		},
		async runAgent() {
			if (!this.requestText.trim()) {
				uni.showToast({
					title: '请输入点餐需求',
					icon: 'none'
				})
				return
			}

			if (this.dishes.length === 0) {
				await this.loadDishes()
			}

			this.plan = smartOrderAgent.generateSmartOrderPlan(this.dishes, this.requestText)
			this.trace = this.plan.trace || []
		},
		confirmAddToCart() {
			if (!this.plan || !this.plan.items.length) {
				return
			}

			let cart = storage.get('cart') || []
			this.plan.items.forEach(dish => {
				cart = recommendation.addDishToCart(cart, dish)
			})
			storage.set('cart', cart)
			this.cart = cart
			uni.showToast({
				title: '已加入购物车',
				icon: 'success',
				duration: 1000
			})
		},
		loadCart() {
			this.cart = storage.get('cart') || []
		},
		goToCart() {
			if (this.cartCount === 0) {
				uni.showToast({
					title: '购物车是空的',
					icon: 'none'
				})
				return
			}
			uni.navigateTo({
				url: '/pages/cart/cart'
			})
		},
		formatTraceOutput(output) {
			if (!output) {
				return ''
			}
			return JSON.stringify(output)
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	padding: 24rpx 24rpx 140rpx;
	background: #f6f7f9;
	box-sizing: border-box;
}

.hero,
.input-panel,
.summary-panel,
.dish-item,
.trace-panel,
.state {
	background: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 18rpx rgba(20, 24, 32, 0.06);
}

.hero {
	padding: 30rpx 28rpx;
	border-left: 8rpx solid #3157d4;
	margin-bottom: 22rpx;
}

.eyebrow {
	font-size: 22rpx;
	color: #3157d4;
	font-weight: 700;
	margin-bottom: 8rpx;
}

.title {
	font-size: 38rpx;
	color: #20242c;
	font-weight: 700;
	line-height: 1.2;
}

.subtitle {
	font-size: 25rpx;
	color: #717783;
	margin-top: 10rpx;
}

.input-panel {
	padding: 24rpx;
	margin-bottom: 22rpx;
}

.agent-input {
	width: 100%;
	min-height: 180rpx;
	padding: 20rpx;
	background: #f1f3f5;
	border-radius: 8rpx;
	font-size: 28rpx;
	line-height: 1.45;
	color: #20242c;
	box-sizing: border-box;
}

.primary-btn,
.confirm-btn {
	margin: 20rpx 0 0;
	width: 100%;
	height: 72rpx;
	line-height: 72rpx;
	border-radius: 8rpx;
	background: #3157d4;
	color: #fff;
	font-size: 28rpx;
	font-weight: 700;
}

.primary-btn[disabled] {
	background: #a8adb7;
	color: #fff;
}

.summary-panel {
	padding: 24rpx;
	margin-bottom: 22rpx;
}

.summary-title,
.trace-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #20242c;
	margin-bottom: 12rpx;
}

.summary-text {
	font-size: 27rpx;
	color: #4d5561;
	line-height: 1.45;
}

.summary-meta {
	display: flex;
	justify-content: space-between;
	margin-top: 18rpx;
	font-size: 24rpx;
	color: #717783;
}

.state {
	height: 260rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 22rpx;
}

.state-title {
	font-size: 28rpx;
	color: #717783;
}

.dish-list {
	display: flex;
	flex-direction: column;
	gap: 22rpx;
	margin-bottom: 22rpx;
}

.dish-item {
	display: flex;
	padding: 22rpx;
}

.dish-image {
	width: 170rpx;
	height: 170rpx;
	border-radius: 8rpx;
	background: #e9edf2;
	flex-shrink: 0;
}

.placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	font-size: 38rpx;
	font-weight: 700;
	background: #3157d4;
}

.dish-info {
	flex: 1;
	min-width: 0;
	margin-left: 20rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.dish-name {
	font-size: 31rpx;
	font-weight: 700;
	color: #20242c;
	line-height: 1.25;
}

.dish-reason {
	font-size: 24rpx;
	color: #717783;
	line-height: 1.45;
	margin: 10rpx 0 14rpx;
}

.dish-price {
	font-size: 34rpx;
	color: #e5482f;
	font-weight: 700;
}

.confirm-btn {
	background: #ff6b35;
}

.trace-panel {
	padding: 24rpx;
	margin-bottom: 22rpx;
}

.trace-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.trace-item {
	display: flex;
	gap: 16rpx;
	align-items: flex-start;
}

.trace-index {
	width: 44rpx;
	height: 44rpx;
	line-height: 44rpx;
	text-align: center;
	border-radius: 50%;
	background: #eef2ff;
	color: #3157d4;
	font-size: 22rpx;
	font-weight: 700;
	flex-shrink: 0;
}

.trace-body {
	flex: 1;
	min-width: 0;
	padding-bottom: 14rpx;
	border-bottom: 1rpx solid #eef0f3;
}

.trace-tool {
	font-size: 25rpx;
	font-weight: 700;
	color: #20242c;
}

.trace-output {
	font-size: 21rpx;
	color: #717783;
	line-height: 1.35;
	margin-top: 6rpx;
	word-break: break-all;
}

.cart-bar {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: 24rpx;
	height: 96rpx;
	padding: 0 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #20242c;
	border-radius: 8rpx;
	box-shadow: 0 10rpx 28rpx rgba(20, 24, 32, 0.18);
	z-index: 20;
}

.cart-info {
	display: flex;
	align-items: center;
	gap: 18rpx;
	color: #fff;
}

.cart-icon {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ff6b35;
	font-size: 24rpx;
	font-weight: 700;
}

.cart-count {
	font-size: 23rpx;
	color: #cdd2d9;
}

.cart-price {
	font-size: 31rpx;
	color: #fff;
	font-weight: 700;
}

.cart-btn {
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 30rpx;
	border-radius: 8rpx;
	background: #ffffff;
	color: #20242c;
	font-size: 26rpx;
	font-weight: 700;
}
</style>
