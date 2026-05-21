<template>
	<view class="container">
		<view v-if="orders.length === 0" class="empty">
			<text class="empty-icon">📋</text>
			<text class="empty-text">暂无订单</text>
		</view>

			<view v-else class="order-list">
				<view v-for="order in orders" :key="order.id" class="order-item" @click="goToDetail(order.id)">
					<view class="order-header">
						<view class="order-id">订单号: {{ order.id }}</view>
						<view class="order-status-group">
							<view :class="['order-status', getStatusClass(order.status)]">
								{{ order.status }}
							</view>
							<view v-if="order.payStatus" :class="['pay-status', order.payStatus === '已支付' ? 'paid' : 'unpaid']">
								{{ order.payStatus }}
							</view>
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
						<view v-if="order.payStatus === '未支付'" class="pay-btn" @click.stop="showPayQRCode(order)">
							去支付
						</view>
						<view v-if="order.status === '待上菜'" class="status-btn" @click.stop="markComplete(order)">
							标记已上齐
						</view>
					</view>
				</view>
			</view>

		<!-- 支付二维码弹窗 -->
		<view v-if="showQRCodeModal" class="qrcode-modal" @click="closeQRCodeModal">
			<view class="qrcode-content" @click.stop>
				<view class="qrcode-header">
					<text class="qrcode-title">扫码支付</text>
					<text class="close-btn" @click="closeQRCodeModal">✕</text>
				</view>
				<view class="qrcode-amount">应付金额: ¥{{ currentOrder.totalPrice }}</view>
				<view class="qrcode-wrapper">
					<image v-if="qrCodeUrl" :src="qrCodeUrl" class="qrcode-image" mode="aspectFit" show-menu-by-longpress></image>
					<view v-else class="qrcode-loading">加载中...</view>
				</view>
				<view class="qrcode-tip">请使用微信扫一扫进行支付</view>
				<view class="qrcode-actions">
					<button class="confirm-btn" @click="confirmPayment">已完成支付</button>
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
			showQRCodeModal: false,
			currentOrder: null,
			qrCodeUrl: ''
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
							totalPrice: order.totalPrice || order.total_price || 0,
							payStatus: order.payStatus || order.pay_status || '未支付',
							createTime: order.createTime
								? new Date(order.createTime).toLocaleString('zh-CN', {
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									hour12: false
								})
								: (order.created_at
									? new Date(order.created_at).toLocaleString('zh-CN', {
										year: 'numeric',
										month: '2-digit',
										day: '2-digit',
										hour: '2-digit',
										minute: '2-digit',
										hour12: false
									})
									: '未知时间')
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
			goToDetail(orderId) {
				uni.navigateTo({
					url: `/pages/order/detail?id=${orderId}`
				})
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
			},
			// 显示支付二维码
			async showPayQRCode(order) {
				console.log('========== 开始显示支付二维码 ==========')
				console.log('点击支付按钮，订单信息:', order)

				this.currentOrder = order
				this.showQRCodeModal = true
				this.qrCodeUrl = ''

				try {
					uni.showLoading({ title: '加载中...' })

					console.log('开始调用云函数获取图片链接')

					// 通过云函数获取临时https链接
					const res = await api.orders.getPayQRCodeUrl()

					console.log('云函数返回结果:', JSON.stringify(res, null, 2))

					uni.hideLoading()

					if (res.success && res.data && res.data.url) {
						this.qrCodeUrl = res.data.url
						console.log('✅ 成功获取网络图片链接:', this.qrCodeUrl)
						console.log('是否以 https:// 开头:', this.qrCodeUrl.startsWith('https://'))

						// 显示提示
						uni.showToast({
							title: '图片已加载，可长按识别',
							icon: 'none',
							duration: 2000
						})
					} else {
						console.error('❌ 获取图片链接失败:', res)
						throw new Error(res.message || '获取图片链接失败')
					}
				} catch (error) {
					uni.hideLoading()
					console.error('❌ 获取图片链接异常:', error)
					console.error('错误详情:', JSON.stringify(error, null, 2))

					let errorMsg = '加载失败'
					if (error.errMsg) {
						errorMsg = error.errMsg
					} else if (error.message) {
						errorMsg = error.message
					}

					uni.showModal({
						title: '加载失败',
						content: errorMsg + '\n\n请确认云存储文件是否存在',
						showCancel: false
					})
					this.closeQRCodeModal()
				}

				console.log('========== 支付二维码显示流程结束 ==========')
			},
			// 关闭二维码弹窗
			closeQRCodeModal() {
				this.showQRCodeModal = false
				this.currentOrder = null
				this.qrCodeUrl = ''
			},
			// 确认支付完成
			confirmPayment() {
				uni.showModal({
					title: '确认',
					content: '确认已完成支付？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const result = await api.orders.updatePayStatus(this.currentOrder.id, '已支付')

								if (result.success) {
									this.closeQRCodeModal()
									this.loadOrders()
									uni.showToast({
										title: '支付状态已更新',
										icon: 'success'
									})
								}
							} catch (error) {
								console.error('更新支付状态失败:', error)
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

.order-status-group {
	display: flex;
	gap: 10rpx;
	align-items: center;
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

.pay-status {
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	font-size: 24rpx;
}

.pay-status.paid {
	background: #e8f5e9;
	color: #4caf50;
}

.pay-status.unpaid {
	background: #ffebee;
	color: #f44336;
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

/* 二维码弹窗样式 */
.qrcode-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.qrcode-content {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	width: 600rpx;
	max-width: 90%;
}

.qrcode-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.qrcode-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.close-btn {
	font-size: 40rpx;
	color: #999;
	line-height: 1;
}

.qrcode-amount {
	text-align: center;
	font-size: 40rpx;
	color: #ff6b6b;
	font-weight: bold;
	margin-bottom: 30rpx;
}

.qrcode-wrapper {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 30rpx;
	background: #f5f5f5;
	border-radius: 16rpx;
	margin-bottom: 30rpx;
}

.qrcode-image {
	width: 400rpx;
	height: 400rpx;
}

.qrcode-loading {
	width: 400rpx;
	height: 400rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #999;
}

.qrcode-tip {
	text-align: center;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 30rpx;
}

.qrcode-actions {
	display: flex;
	gap: 20rpx;
}

.confirm-btn {
	flex: 1;
	background: #ff6b6b;
	color: #fff;
	border: none;
	border-radius: 30rpx;
	padding: 20rpx;
	font-size: 28rpx;
}
</style>
