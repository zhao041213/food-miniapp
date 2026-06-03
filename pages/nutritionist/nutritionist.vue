<template>
	<view class="container">
		<view class="hero">
			<view class="eyebrow">AI NUTRITIONIST</view>
			<view class="title">AI营养师</view>
			<view class="subtitle">输入基础信息，生成适合你的菜品组合</view>
		</view>

		<view class="form-panel">
			<view class="form-row">
				<view class="field">
					<text class="field-label">身高 cm</text>
					<input class="field-input" type="number" v-model="form.height" placeholder="170" />
				</view>
				<view class="field">
					<text class="field-label">体重 kg</text>
					<input class="field-input" type="digit" v-model="form.weight" placeholder="65" />
				</view>
			</view>
			<view class="field">
				<text class="field-label">年龄</text>
				<input class="field-input" type="number" v-model="form.age" placeholder="30" />
			</view>
			<button class="primary-btn" :disabled="loading" @click="generateRecommendations">
				生成推荐
			</button>
		</view>

		<view v-if="profile" class="profile-card">
			<view class="profile-main">
				<text class="profile-label">BMI</text>
				<text class="profile-value">{{ profile.bmi }}</text>
			</view>
			<view class="profile-summary">{{ profile.summary }}</view>
		</view>

		<view v-if="loading" class="state">
			<view class="state-title">正在分析</view>
		</view>

		<view v-else-if="hasGenerated && recommendations.length === 0" class="state">
			<view class="state-title">暂无可推荐菜品</view>
			<button class="state-btn" @click="loadDishes">重新加载</button>
		</view>

		<view v-else-if="recommendations.length > 0" class="recommend-list">
			<view
				v-for="dish in recommendations"
				:key="dish.id"
				class="recommend-item"
			>
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
					<view class="dish-bottom">
						<view class="dish-price">¥{{ dish.price }}</view>
						<button class="add-btn" @click="addToCart(dish)">加入购物车</button>
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
import * as nutritionist from '@/utils/nutritionist.js'

export default {
	data() {
		return {
			form: {
				height: '',
				weight: '',
				age: ''
			},
			dishes: [],
			recommendations: [],
			profile: null,
			cart: [],
			loading: false,
			hasGenerated: false
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
				console.error('获取营养推荐菜品失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.loadCart()
			}
		},
		async generateRecommendations() {
			try {
				this.profile = nutritionist.buildNutritionProfile(this.form)
			} catch (error) {
				uni.showToast({
					title: error.message,
					icon: 'none'
				})
				return
			}

			if (this.dishes.length === 0) {
				await this.loadDishes()
			}

			this.recommendations = nutritionist.recommendNutritionDishes(this.dishes, this.profile, 3)
			this.hasGenerated = true
		},
		loadCart() {
			this.cart = storage.get('cart') || []
		},
		addToCart(dish) {
			const cart = recommendation.addDishToCart(storage.get('cart') || [], dish)
			storage.set('cart', cart)
			this.cart = cart
			uni.showToast({
				title: '已加入购物车',
				icon: 'success',
				duration: 1000
			})
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
.form-panel,
.profile-card,
.recommend-item,
.state {
	background: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 18rpx rgba(20, 24, 32, 0.06);
}

.hero {
	padding: 30rpx 28rpx;
	border-left: 8rpx solid #2f855a;
	margin-bottom: 22rpx;
}

.eyebrow {
	font-size: 22rpx;
	color: #2f855a;
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

.form-panel {
	padding: 24rpx;
	margin-bottom: 22rpx;
}

.form-row {
	display: flex;
	gap: 18rpx;
}

.field {
	flex: 1;
	margin-bottom: 18rpx;
}

.field-label {
	display: block;
	font-size: 24rpx;
	color: #717783;
	margin-bottom: 10rpx;
}

.field-input {
	height: 72rpx;
	padding: 0 20rpx;
	background: #f1f3f5;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: #20242c;
	box-sizing: border-box;
}

.primary-btn,
.state-btn,
.add-btn {
	margin: 0;
	border-radius: 8rpx;
	font-weight: 700;
}

.primary-btn {
	width: 100%;
	height: 72rpx;
	line-height: 72rpx;
	background: #2f855a;
	color: #fff;
	font-size: 28rpx;
}

.primary-btn[disabled] {
	background: #a8adb7;
	color: #fff;
}

.profile-card {
	display: flex;
	align-items: center;
	gap: 22rpx;
	padding: 22rpx 24rpx;
	margin-bottom: 22rpx;
}

.profile-main {
	min-width: 116rpx;
	height: 88rpx;
	border-radius: 8rpx;
	background: #e8f4ee;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.profile-label {
	font-size: 20rpx;
	color: #2f855a;
}

.profile-value {
	font-size: 32rpx;
	font-weight: 700;
	color: #1f6f49;
}

.profile-summary {
	flex: 1;
	font-size: 26rpx;
	line-height: 1.45;
	color: #4d5561;
}

.state {
	height: 300rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.state-title {
	font-size: 30rpx;
	color: #717783;
	margin-bottom: 20rpx;
}

.state-btn {
	min-width: 150rpx;
	height: 64rpx;
	line-height: 64rpx;
	padding: 0 24rpx;
	background: #20242c;
	color: #fff;
	font-size: 26rpx;
}

.recommend-list {
	display: flex;
	flex-direction: column;
	gap: 22rpx;
}

.recommend-item {
	display: flex;
	padding: 22rpx;
}

.dish-image {
	width: 190rpx;
	height: 190rpx;
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
	background: #2f855a;
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

.dish-bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.dish-price {
	font-size: 34rpx;
	color: #e5482f;
	font-weight: 700;
}

.add-btn {
	min-width: 172rpx;
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 20rpx;
	background: #ff6b35;
	color: #fff;
	font-size: 25rpx;
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
