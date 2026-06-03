<template>
	<view class="container">
		<view class="hero">
			<view>
				<view class="eyebrow">AI RECOMMEND</view>
				<view class="title">AI菜品推荐</view>
				<view class="subtitle">为你挑选店内热卖菜品</view>
			</view>
			<button class="refresh-btn" :disabled="loading" @click="refreshRecommendations">
				换一批
			</button>
		</view>

		<view class="agent-entry" @click="goToSmartOrderAgent">
			<view>
				<view class="entry-title">智能点餐 Agent</view>
				<view class="entry-desc">输入预算和口味，自动组合菜品</view>
			</view>
			<view class="entry-action blue">去点餐</view>
		</view>

		<view class="agent-entry nutrition" @click="goToNutritionist">
			<view>
				<view class="entry-title">AI营养师</view>
				<view class="entry-desc">按身高、体重和年龄推荐菜品</view>
			</view>
			<view class="entry-action green">去测算</view>
		</view>

		<view v-if="loading" class="state">
			<view class="state-title">正在加载</view>
		</view>

		<view v-else-if="recommendations.length === 0" class="state">
			<view class="state-title">暂无可推荐菜品</view>
			<button class="state-btn" @click="loadData">重新加载</button>
		</view>

		<view v-else class="recommend-list">
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
					<view class="dish-desc">{{ dish.description || dish.category || '今日推荐菜品' }}</view>
					<view class="dish-meta">
						<view class="dish-price">¥{{ dish.price }}</view>
						<view v-if="dish.sales" class="dish-sales">月售 {{ dish.sales }}</view>
					</view>
					<button class="order-btn" @click="addToCart(dish)">加入购物车</button>
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

export default {
	data() {
		return {
			dishes: [],
			recommendations: [],
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
		this.loadData()
	},
	onShow() {
		this.loadCart()
	},
	methods: {
		async loadData() {
			this.loading = true
			try {
				const res = await api.dishes.getAll(false)
				if (res.success) {
					this.dishes = res.data.map(dish => ({
						...dish,
						id: dish.id || dish._id
					}))
					this.refreshRecommendations()
				}
			} catch (error) {
				console.error('获取推荐菜品失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.loadCart()
			}
		},
		refreshRecommendations() {
			this.recommendations = recommendation.pickRecommendedDishes(this.dishes, 3)
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
		goToSmartOrderAgent() {
			uni.navigateTo({
				url: '/pages/smart-order/smart-order'
			})
		},
		goToNutritionist() {
			uni.navigateTo({
				url: '/pages/nutritionist/nutritionist'
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

.hero {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 30rpx 28rpx;
	background: #ffffff;
	border-radius: 8rpx;
	border-left: 8rpx solid #ff6b35;
	box-shadow: 0 4rpx 18rpx rgba(20, 24, 32, 0.06);
	margin-bottom: 24rpx;
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

.refresh-btn,
.state-btn {
	margin: 0;
	min-width: 150rpx;
	height: 66rpx;
	line-height: 66rpx;
	padding: 0 26rpx;
	border-radius: 8rpx;
	background: #20242c;
	color: #fff;
	font-size: 26rpx;
	font-weight: 600;
}

.refresh-btn[disabled] {
	background: #a8adb7;
	color: #fff;
}

.agent-entry {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding: 24rpx 26rpx;
	background: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 18rpx rgba(20, 24, 32, 0.06);
	margin-bottom: 24rpx;
	border-left: 8rpx solid #3157d4;
}

.agent-entry.nutrition {
	border-left: 8rpx solid #2f855a;
}

.entry-title {
	font-size: 30rpx;
	color: #20242c;
	font-weight: 700;
	line-height: 1.25;
}

.entry-desc {
	font-size: 24rpx;
	color: #717783;
	margin-top: 8rpx;
}

.entry-action {
	min-width: 116rpx;
	height: 58rpx;
	line-height: 58rpx;
	text-align: center;
	border-radius: 8rpx;
	color: #fff;
	font-size: 24rpx;
	font-weight: 700;
}

.entry-action.blue {
	background: #3157d4;
}

.entry-action.green {
	background: #2f855a;
}

.state {
	height: 420rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #ffffff;
	border-radius: 8rpx;
}

.state-title {
	font-size: 30rpx;
	color: #717783;
	margin-bottom: 22rpx;
}

.recommend-list {
	display: flex;
	flex-direction: column;
	gap: 22rpx;
}

.recommend-item {
	display: flex;
	padding: 22rpx;
	background: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 18rpx rgba(20, 24, 32, 0.06);
}

.dish-image {
	width: 210rpx;
	height: 210rpx;
	border-radius: 8rpx;
	background: #e9edf2;
	flex-shrink: 0;
}

.placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	font-size: 40rpx;
	font-weight: 700;
	background: #2f855a;
}

.dish-info {
	flex: 1;
	min-width: 0;
	margin-left: 22rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.dish-name {
	font-size: 32rpx;
	font-weight: 700;
	color: #20242c;
	line-height: 1.25;
}

.dish-desc {
	font-size: 25rpx;
	color: #717783;
	line-height: 1.4;
	margin: 10rpx 0 14rpx;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.dish-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.dish-price {
	font-size: 36rpx;
	color: #e5482f;
	font-weight: 700;
}

.dish-sales {
	font-size: 22rpx;
	color: #9aa1ac;
}

.order-btn {
	margin: 0;
	width: 100%;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 8rpx;
	background: #ff6b35;
	color: #fff;
	font-size: 27rpx;
	font-weight: 700;
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
