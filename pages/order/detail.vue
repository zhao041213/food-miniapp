<template>
	<view class="container">
		<view v-if="order" class="detail-content">
			<view class="order-info">
				<view class="info-row">
					<text class="label">订单号:</text>
					<text class="value">{{ order.id }}</text>
				</view>
				<view class="info-row">
					<text class="label">下单时间:</text>
					<text class="value">{{ order.createTime }}</text>
				</view>
				<view class="info-row">
					<text class="label">订单状态:</text>
					<text :class="['status-value', getStatusClass(order.status)]">{{ order.status }}</text>
				</view>
			</view>

			<view class="dishes-section">
				<view class="section-title">菜品详情</view>
				<view class="dishes-list">
					<view v-for="item in order.items" :key="item.id" class="dish-item">
						<image
							v-if="item.image"
							:src="item.image"
							class="dish-image"
							mode="aspectFill"
						></image>
						<view v-else class="dish-image-placeholder">
							<text class="placeholder-icon">🍽️</text>
						</view>
						<view class="dish-info">
							<view class="dish-name">{{ item.name }}</view>
							<view class="dish-price">¥{{ item.price }}</view>
						</view>
						<view class="dish-count">x{{ item.count }}</view>
						<view class="dish-total">¥{{ item.price * item.count }}</view>
					</view>
				</view>
			</view>

			<view class="total-section">
				<view class="total-row">
					<text class="total-label">总金额</text>
					<text class="total-price">¥{{ order.totalPrice }}</text>
				</view>
			</view>

			<view class="action-section">
				<button
					v-if="order.payStatus === '已支付'"
					class="paid-btn"
					disabled
				>
					已支付
				</button>
				<button
					v-else
					class="pay-btn"
					@click="handlePay"
				>
					立即支付
				</button>
			</view>
		</view>

		<view v-else class="loading">
			<text>加载中...</text>
		</view>
	</view>
</template>

<script>
import api from '@/utils/api.js'

export default {
	data() {
		return {
			orderId: null,
			order: null
		}
	},
	onLoad(options) {
		if (options.id) {
			this.orderId = options.id
			this.loadOrderDetail()
		}
	},
	methods: {
		async loadOrderDetail() {
			try {
				const res = await api.orders.getById(this.orderId)

				if (res.success) {
					const orderData = res.data
					this.order = {
						...orderData,
						totalPrice: orderData.totalPrice || orderData.total_price || 0,
						createTime: orderData.createTime
							? new Date(orderData.createTime).toLocaleString('zh-CN', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
								hour12: false
							})
							: (orderData.created_at
								? new Date(orderData.created_at).toLocaleString('zh-CN', {
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
									hour12: false
								})
								: '未知时间')
					}

					// 调试：打印订单数据查看图片信息
					console.log('订单详情:', this.order)
					console.log('原始数据:', orderData)
					console.log('菜品列表:', this.order.items)
					console.log('总金额:', this.order.totalPrice)
				}
			} catch (error) {
				console.error('获取订单详情失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		getStatusClass(status) {
			const statusMap = {
				'制作中': 'processing',
				'待上菜': 'ready',
				'已上齐': 'completed'
			}
			return statusMap[status] || ''
		},
		handlePay() {
			uni.showModal({
				title: '模拟支付',
				content: `支付金额：¥${this.order.totalPrice}\n\n当前为模拟支付环境，点击确定模拟支付成功`,
				confirmText: '确认支付',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						// 显示支付中
						uni.showLoading({
							title: '支付中...',
							mask: true
						})

						// 模拟支付延迟
						setTimeout(async () => {
							try {
								const result = await api.orders.updatePayStatus(this.orderId, '已支付')

								uni.hideLoading()

								if (result.success) {
									// 显示支付成功
									uni.showToast({
										title: '支付成功',
										icon: 'success',
										duration: 2000
									})

									// 刷新订单数据
									setTimeout(() => {
										this.loadOrderDetail()
									}, 500)
								} else {
									uni.showToast({
										title: '支付失败',
										icon: 'none'
									})
								}
							} catch (error) {
								uni.hideLoading()
								console.error('支付失败:', error)
								uni.showToast({
									title: '支付失败，请重试',
									icon: 'none'
								})
							}
						}, 1500)
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 120rpx;
}

.loading {
	display: flex;
	justify-content: center;
	align-items: center;
	padding-top: 200rpx;
	font-size: 28rpx;
	color: #999;
}

.detail-content {
	padding: 20rpx;
}

.order-info {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.info-row:last-child {
	margin-bottom: 0;
}

.label {
	font-size: 28rpx;
	color: #666;
}

.value {
	font-size: 28rpx;
	color: #333;
}

.status-value {
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
}

.status-value.processing {
	background: #e3f2fd;
	color: #2196f3;
}

.status-value.ready {
	background: #fff3e0;
	color: #ff9800;
}

.status-value.completed {
	background: #e8f5e9;
	color: #4caf50;
}

.dishes-section {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.dishes-list {
	border-top: 1rpx solid #f0f0f0;
	padding-top: 20rpx;
}

.dish-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.dish-item:last-child {
	margin-bottom: 0;
	padding-bottom: 0;
	border-bottom: none;
}

.dish-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	background: #f5f5f5;
}

.dish-image-placeholder {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	background: #f5f5f5;
	display: flex;
	align-items: center;
	justify-content: center;
}

.placeholder-icon {
	font-size: 50rpx;
}

.dish-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.dish-name {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 10rpx;
}

.dish-price {
	font-size: 24rpx;
	color: #999;
}

.dish-count {
	font-size: 26rpx;
	color: #666;
	margin-right: 30rpx;
}

.dish-total {
	font-size: 28rpx;
	color: #ff6b6b;
	font-weight: bold;
	min-width: 100rpx;
	text-align: right;
}

.total-section {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.total-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.total-label {
	font-size: 32rpx;
	color: #333;
	font-weight: bold;
}

.total-price {
	font-size: 36rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.action-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	padding: 20rpx;
	box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.08);
}

.pay-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 44rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
}

.paid-btn {
	width: 100%;
	height: 88rpx;
	background: #e0e0e0;
	color: #999;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 44rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
