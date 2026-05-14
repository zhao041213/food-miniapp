<template>
	<view class="container">
		<view v-if="orders.length === 0" class="empty">
			<text class="empty-icon">📋</text>
			<text class="empty-text">暂无订单</text>
		</view>

			<view v-else class="order-list">
				<view v-for="order in orders" :key="order.id" class="order-item">
					<view class="order-header">
						<view class="order-id">订单号: {{ order.id }}</view>
						<view :class="['order-status', getStatusClass(order.status)]">
							{{ order.status }}
						</view>
					</view>
					<view class="order-time">下单时间: {{ order.createTime }}</view>

					<view class="order-dishes">
						<view v-for="item in order.items" :key="item.id" class="dish-row">
							<view class="dish-name">{{ item.name }}</view>
							<view class="dish-count">x{{ item.count }}</view>
							<view class="dish-price">¥{{ item.price * item.count }}</view>
						</view>
					</view>

					<view class="order-footer">
						<view class="order-total">总计: ¥{{ order.totalPrice }}</view>
						<view v-if="order.status === '待上菜'" class="status-btn" @click="markComplete(order)">
							标记已上齐
						</view>
					</view>
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
			orders: []
		}
	},
	onShow() {
		this.loadOrders()
	},
		methods: {
			async loadOrders() {
				try {
					const userInfo = storage.get('userInfo')
					const userId = userInfo ? userInfo.id : null

					const res = await api.orders.getAll(userId)

					if (res.success) {
						this.orders = res.data.map(order => ({
							...order,
							createTime: new Date(order.created_at).toLocaleString()
						}))
					}
				} catch (error) {
					console.error('获取订单失败:', error)
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
			markComplete(order) {
				uni.showModal({
					title: '确认',
					content: '确认菜品已全部上齐？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const result = await api.orders.updateStatus(order.id, '已上齐')

								if (result.success) {
									this.loadOrders()
									uni.showToast({
										title: '已标记为上齐',
										icon: 'success'
									})
								}
							} catch (error) {
								console.error('更新状态失败:', error)
								uni.showToast({
									title: '操作失败',
									icon: 'none'
								})
							}
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
	padding: 20rpx;
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
}

.order-list {
	padding-bottom: 20rpx;
}

.order-item {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.order-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.order-id {
	font-size: 28rpx;
	color: #666;
}

.order-status {
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
}

.order-status.pending {
	background: #ffebee;
	color: #f44336;
}

.order-status.processing {
	background: #e3f2fd;
	color: #2196f3;
}

.order-status.ready {
	background: #fff3e0;
	color: #ff9800;
}

.order-status.completed {
	background: #e8f5e9;
	color: #4caf50;
}

.order-time {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 20rpx;
}

.order-dishes {
	border-top: 1rpx solid #f0f0f0;
	border-bottom: 1rpx solid #f0f0f0;
	padding: 20rpx 0;
	margin-bottom: 20rpx;
}

.dish-row {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

.dish-row:last-child {
	margin-bottom: 0;
}

.dish-name {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.dish-count {
	font-size: 26rpx;
	color: #666;
	margin-right: 20rpx;
}

.dish-price {
	font-size: 28rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.order-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.order-total {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.pay-btn {
	background: #ff6b6b;
	color: #fff;
	padding: 15rpx 30rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
}

.status-btn {
	background: #3cc51f;
	color: #fff;
	padding: 15rpx 30rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
}
</style>
