<template>
	<view class="container">
		<view class="tabs">
			<view :class="['tab-item', currentTab === 'all' ? 'active' : '']" @click="switchTab('all')">
				全部订单
			</view>
			<view :class="['tab-item', currentTab === 'pending' ? 'active' : '']" @click="switchTab('pending')">
				待处理
			</view>
		</view>

		<view v-if="filteredOrders.length === 0" class="empty">
			<text class="empty-icon">📦</text>
			<text class="empty-text">暂无订单</text>
		</view>

		<view v-else class="order-list">
			<view v-for="order in filteredOrders" :key="order.id" class="order-item">
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
					<view class="order-actions">
						<view v-if="order.status === '制作中'" class="action-btn ready" @click="updateStatus(order, '待上菜')">
							制作完成
						</view>
						<view v-if="order.status === '待上菜'" class="action-btn complete" @click="updateStatus(order, '已上齐')">
							已上齐
						</view>
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
			orders: [],
			currentTab: 'all'
		}
	},
	computed: {
		filteredOrders() {
			if (this.currentTab === 'pending') {
				return this.orders.filter(o => o.status === '制作中' || o.status === '待上菜')
			}
			return this.orders
		}
	},
	onShow() {
		this.checkAuth()
		this.loadOrders()
	},
	methods: {
		checkAuth() {
			const user = storage.get('userInfo')
			if (!user || user.role !== 'admin') {
				uni.showToast({
					title: '无权限访问',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			}
		},
		async loadOrders() {
			try {
				const res = await api.orders.getAll()

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
		switchTab(tab) {
			this.currentTab = tab
		},
		getStatusClass(status) {
			const statusMap = {
				'待支付': 'pending',
				'制作中': 'processing',
				'待上菜': 'ready',
				'已上齐': 'completed'
			}
			return statusMap[status] || ''
		},
		async updateStatus(order, newStatus) {
			const statusText = {
				'待上菜': '标记为制作完成',
				'已上齐': '标记为已上齐'
			}

			uni.showModal({
				title: '确认',
				content: `确认${statusText[newStatus]}？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const result = await api.orders.updateStatus(order.id, newStatus)

							if (result.success) {
								this.loadOrders()
								uni.showToast({
									title: '状态更新成功',
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
	background: #f5f5f5;
}

.tabs {
	display: flex;
	background: #fff;
	position: sticky;
	top: 0;
	z-index: 10;
}

.tab-item {
	flex: 1;
	text-align: center;
	padding: 30rpx;
	font-size: 28rpx;
	color: #666;
	position: relative;
}

.tab-item.active {
	color: #3cc51f;
	font-weight: bold;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: #3cc51f;
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
	padding: 20rpx;
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

.order-actions {
	display: flex;
	gap: 10rpx;
}

.action-btn {
	padding: 15rpx 30rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #fff;
}

.action-btn.ready {
	background: #ff9800;
}

.action-btn.complete {
	background: #3cc51f;
}
</style>
