<template>
	<view class="container">
		<view v-if="cart.length === 0" class="empty">
			<text class="empty-icon">🛒</text>
			<text class="empty-text">购物车是空的</text>
			<view class="empty-btn" @click="goBack">去点餐</view>
		</view>

		<view v-else>
			<!-- 购物车列表 -->
			<view class="cart-list">
				<view v-for="item in cart" :key="item.id" class="cart-item">
					<image :src="item.image" class="item-image" mode="aspectFill"></image>
					<view class="item-info">
						<view class="item-name">{{ item.name }}</view>
						<view class="item-price">¥{{ item.price }}</view>
					</view>
					<view class="item-control">
						<view class="control-btn" @click="decreaseCount(item)">-</view>
						<view class="control-count">{{ item.count }}</view>
						<view class="control-btn" @click="increaseCount(item)">+</view>
					</view>
				</view>
			</view>

			<!-- 结算栏 -->
			<view class="settle-bar">
				<view class="settle-info">
					<view class="settle-label">总计:</view>
					<view class="settle-price">¥{{ totalPrice }}</view>
				</view>
				<view class="settle-btn" @click="submitOrder">提交订单</view>
			</view>
		</view>
	</view>
</template>

<script>
import api from '@/utils/api.js'
import storage from '@/utils/storage.js'

export default {
	data() {
		return {
			cart: []
		}
	},
	computed: {
		totalPrice() {
			return this.cart.reduce((sum, item) => sum + item.price * item.count, 0)
		}
	},
	onLoad() {
		this.loadCart()
	},
	methods: {
		loadCart() {
			this.cart = storage.get('cart') || []
		},
		decreaseCount(item) {
			if (!item.count) {
				item.count = 1
			}

			if (item.count > 1) {
				item.count--
				storage.set('cart', this.cart)
			} else {
				uni.showModal({
					title: '提示',
					content: '确定要移除该菜品吗？',
					success: (res) => {
						if (res.confirm) {
							this.cart = this.cart.filter(i => i.id !== item.id)
							storage.set('cart', this.cart)
						}
					}
				})
				return
			}
			this.loadCart()
		},
		increaseCount(item) {
			if (!item.count) {
				item.count = 1
			}
			item.count++
			storage.set('cart', this.cart)
			this.loadCart()
		},
		async submitOrder() {
			const userInfo = storage.get('userInfo')

			if (!userInfo) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/mine/mine'
					})
				}, 1500)
				return
			}

			uni.showModal({
				title: '确认订单',
				content: `总计: ¥${this.totalPrice}，确认提交订单吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '提交中...'
							})

							// 创建订单
							const orderData = {
								userId: userInfo._id,
								items: this.cart,
								totalPrice: this.totalPrice
							}

							const result = await api.orders.create(orderData)

							uni.hideLoading()

							if (result.success) {
								// 清空购物车
								storage.set('cart', [])

								uni.showToast({
									title: '订单提交成功',
									icon: 'success'
								})

								setTimeout(() => {
									uni.switchTab({
										url: '/pages/order/order'
									})
								}, 1500)
							} else {
								uni.showToast({
									title: '提交失败',
									icon: 'none'
								})
							}
						} catch (error) {
							uni.hideLoading()
							console.error('提交订单失败:', error)
							uni.showToast({
								title: '提交失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		goBack() {
			uni.switchTab({
				url: '/pages/index/index'
			})
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	padding-bottom: 120rpx;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #999;
	margin-bottom: 50rpx;
}

.empty-btn {
	background: #3cc51f;
	color: #fff;
	padding: 20rpx 60rpx;
	border-radius: 50rpx;
	font-size: 28rpx;
}

.cart-list {
	padding: 20rpx;
}

.cart-item {
	display: flex;
	align-items: center;
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.item-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	background: #f0f0f0;
	flex-shrink: 0;
}

.item-info {
	flex: 1;
	margin-left: 20rpx;
}

.item-name {
	font-size: 30rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 10rpx;
}

.item-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.item-control {
	display: flex;
	align-items: center;
}

.control-btn {
	width: 50rpx;
	height: 50rpx;
	background: #3cc51f;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
}

.control-count {
	margin: 0 20rpx;
	font-size: 32rpx;
	font-weight: bold;
	min-width: 40rpx;
	text-align: center;
}

.settle-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 100rpx;
	background: #fff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);
}

.settle-info {
	display: flex;
	align-items: center;
}

.settle-label {
	font-size: 28rpx;
	color: #666;
	margin-right: 10rpx;
}

.settle-price {
	font-size: 40rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.settle-btn {
	background: #3cc51f;
	color: #fff;
	padding: 20rpx 50rpx;
	border-radius: 50rpx;
	font-size: 28rpx;
}
</style>
