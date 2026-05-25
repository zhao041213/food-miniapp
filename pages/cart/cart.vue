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

		<!-- 支付二维码弹窗 -->
		<view v-if="showPayModal" class="pay-modal" @click="closePayModal">
			<view class="pay-content" @click.stop>
				<view class="pay-header">
					<text class="pay-title">请扫码支付</text>
					<text class="close-btn" @click="closePayModal">✕</text>
				</view>
				<view class="pay-amount">应付金额: ¥{{ totalPrice }}</view>
				<view class="qrcode-wrapper">
					<image
						:src="qrcodeSrc"
						class="qrcode-image"
						mode="aspectFit"
						show-menu-by-longpress
						@tap="previewQRCode"
						@load="onImageLoad"
						@error="onImageError"
					></image>
				</view>
				<view class="pay-tip">点击下方按钮复制支付链接</view>
				<view class="pay-actions">
					<button class="scan-btn primary" @click="scanAndPay">复制支付链接</button>
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
			cart: [],
			showPayModal: false,
			debugMsg: '等待操作...',
			qrcodeSrc: '',
			paymentUrl: 'https://payapp.wechatpay.cn/sjt/qr/AQG2WcCmC8wmI9JJ-A--MorT' // 支付链接
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
			console.log('提交订单，用户信息:', userInfo)

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

				console.log('创建订单数据:', orderData)
				const result = await api.orders.create(orderData)
				console.log('创建订单结果:', result)

				uni.hideLoading()

				if (result.success) {
					console.log('订单创建成功，开始获取支付二维码')
					// 获取支付二维码图片链接
					try {
						const qrRes = await api.orders.getPayQRCodeUrl()
						console.log('获取二维码链接结果:', qrRes)

						if (qrRes.success && qrRes.data && qrRes.data.url) {
							this.qrcodeSrc = qrRes.data.url
							console.log('二维码链接:', this.qrcodeSrc)
							// 显示支付二维码
							this.showPayModal = true
							console.log('showPayModal 已设置为:', this.showPayModal)
						} else {
							throw new Error(qrRes.message || '获取二维码失败')
						}
					} catch (error) {
						console.error('获取二维码失败:', error)
						uni.showToast({
							title: '获取二维码失败',
							icon: 'none'
						})
					}
				} else {
					console.error('订单创建失败:', result)
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
		},
		// 图片加载成功
		onImageLoad(e) {
			console.log('图片加载成功:', e)
			console.log('图片详细信息:', {
				width: e.detail.width,
				height: e.detail.height,
				path: this.qrcodeSrc
			})
			this.debugMsg = `图片加载成功 ${e.detail.width}x${e.detail.height}`

			// 尝试获取图片的真实路径
			uni.getImageInfo({
				src: this.qrcodeSrc,
				success: (res) => {
					console.log('图片真实路径:', res.path)
					console.log('图片类型:', res.type)
					// 更新为真实路径
					this.qrcodeSrc = res.path
					this.debugMsg = `已更新为真实路径: ${res.type}`
				},
				fail: (err) => {
					console.error('获取图片信息失败:', err)
				}
			})
		},
		// 预览二维码（点击图片时触发）
		previewQRCode() {
			if (!this.qrcodeSrc) {
				uni.showToast({
					title: '二维码未加载',
					icon: 'none'
				})
				return
			}

			console.log('预览二维码:', this.qrcodeSrc)
			uni.previewImage({
				urls: [this.qrcodeSrc],
				current: this.qrcodeSrc,
				success: () => {
					console.log('图片预览成功，请在预览模式下长按识别')
				},
				fail: (err) => {
					console.error('图片预览失败:', err)
				}
			})
		},
		// 识别并支付
		recognizeQRCode() {
			console.log('点击识别并支付')
			// 放大图片，用户可以长按识别
			uni.previewImage({
				urls: [this.qrcodeSrc],
				current: this.qrcodeSrc,
				success: () => {
					console.log('图片预览成功，请长按识别')
				},
				fail: (err) => {
					console.error('图片预览失败:', err)
					// 如果预览失败，尝试保存到相册
					uni.showModal({
						title: '提示',
						content: '无法直接识别，是否保存到相册后扫描？',
						success: (res) => {
							if (res.confirm) {
								this.saveQRCode()
							}
						}
					})
				}
			})
		},
		// 图片加载失败
		onImageError(e) {
			console.error('图片加载失败:', e)
			this.debugMsg = '图片加载失败: ' + JSON.stringify(e.detail)
		},
		// 长按事件
		onLongPress(e) {
			console.log('触发长按事件:', e)
			console.log('事件详情:', {
				type: e.type,
				target: e.target,
				currentTarget: e.currentTarget,
				detail: e.detail
			})

			// 检查微信版本和基础库版本
			try {
				const systemInfo = uni.getSystemInfoSync()
				console.log('系统信息:', {
					platform: systemInfo.platform,
					version: systemInfo.version,
					SDKVersion: systemInfo.SDKVersion,
					system: systemInfo.system
				})
				this.debugMsg = `长按触发 | 基础库:${systemInfo.SDKVersion} | 微信:${systemInfo.version}`
			} catch (err) {
				console.error('获取系统信息失败:', err)
				this.debugMsg = '已触发长按 ' + new Date().toLocaleTimeString()
			}

			// 尝试手动调用菜单
			console.log('show-menu-by-longpress 属性应该会自动显示菜单')
			console.log('如果没有显示，可能是基础库版本过低或真机不支持')
		},
		// 保存二维码到相册
		saveQRCode() {
			if (!this.qrcodeSrc) {
				uni.showToast({
					title: '二维码未加载',
					icon: 'none'
				})
				return
			}

			uni.showLoading({ title: '保存中...' })

			// 先下载网络图片到本地临时文件
			uni.downloadFile({
				url: this.qrcodeSrc,
				success: (res) => {
					if (res.statusCode === 200) {
						// 保存到相册
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: () => {
								uni.hideLoading()
								uni.showModal({
									title: '保存成功',
									content: '二维码已保存到相册，请打开微信扫一扫，选择相册中的二维码进行支付',
									showCancel: false
								})
							},
							fail: (err) => {
								uni.hideLoading()
								console.error('保存失败:', err)
								if (err.errMsg.includes('auth deny')) {
									uni.showModal({
										title: '提示',
										content: '需要授权访问相册',
										success: (res) => {
											if (res.confirm) {
												uni.openSetting()
											}
										}
									})
								} else {
									uni.showToast({
										title: '保存失败',
										icon: 'none'
									})
								}
							}
						})
					} else {
						uni.hideLoading()
						uni.showToast({
							title: '下载图片失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					uni.hideLoading()
					console.error('下载失败:', err)
					uni.showToast({
						title: '下载图片失败',
						icon: 'none'
					})
					}
			})
		},
		// 扫码并支付（直接复制支付链接）
		scanAndPay() {
			console.log('复制支付链接')
			uni.setClipboardData({
				data: this.paymentUrl,
				success: () => {
					uni.showModal({
						title: '支付链接已复制',
						content: '请按以下步骤操作：\n1. 点击右上角【...】\n2. 选择【在浏览器中打开】\n3. 在浏览器地址栏粘贴链接\n4. 完成支付后返回小程序',
						showCancel: false,
						confirmText: '我知道了'
					})
				},
				fail: (err) => {
					console.error('复制失败:', err)
					uni.showToast({
						title: '复制失败',
						icon: 'none'
					})
				}
			})
		},
		// 测试扫码识别（诊断功能）
		testScanQRCode() {
			console.log('开始测试扫码识别')
			uni.showModal({
				title: '测试说明',
				content: '这个功能会调用微信扫一扫，从相册选择二维码图片进行识别测试。如果能识别成功，说明图片本身是有效的二维码。',
				confirmText: '开始测试',
				success: (res) => {
					if (res.confirm) {
						// 使用 wx.scanCode 从相册选择图片识别
						wx.scanCode({
							onlyFromCamera: false, // 允许从相册选择
							scanType: ['qrCode'], // 只识别二维码
							success: (scanRes) => {
								console.log('扫码成功:', scanRes)
								uni.showModal({
									title: '识别成功',
									content: '二维码内容: ' + scanRes.result,
									showCancel: false
								})
							},
							fail: (err) => {
								console.error('扫码失败:', err)
								uni.showModal({
									title: '识别失败',
									content: err.errMsg || '无法识别二维码',
									showCancel: false
								})
							}
						})
					}
				}
			})
		},
		// 确认支付完成
		confirmPayment() {
			// 清空购物车
			storage.set('cart', [])
			this.showPayModal = false

			uni.showToast({
				title: '订单提交成功',
				icon: 'success'
			})

			setTimeout(() => {
				uni.switchTab({
					url: '/pages/order/order'
				})
			}, 1500)
		},
		// 关闭支付弹窗
		closePayModal() {
			this.showPayModal = false
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

/* 支付弹窗样式 */
.pay-modal {
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

.pay-content {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	width: 600rpx;
	max-width: 90%;
}

.pay-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.pay-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.close-btn {
	font-size: 40rpx;
	color: #999;
	line-height: 1;
}

.pay-amount {
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

.debug-info {
	padding: 20rpx;
	font-size: 24rpx;
	color: #666;
	text-align: center;
	background: #fff;
	margin: 0 30rpx 20rpx;
	border-radius: 10rpx;
	border: 1px solid #eee;
}

.pay-tip {
	text-align: center;
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 10rpx;
}

.pay-tip-sub {
	text-align: center;
	font-size: 24rpx;
	color: #999;
	margin-bottom: 30rpx;
}

.pay-actions {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.scan-btn {
	width: 100%;
	background: #07c160;
	color: #fff;
	border-radius: 50rpx;
	font-size: 32rpx;
	padding: 28rpx;
	border: none;
	font-weight: bold;
}

.confirm-btn {
	width: 100%;
	background: #fff;
	color: #07c160;
	border: 2rpx solid #07c160;
	border-radius: 50rpx;
	font-size: 28rpx;
	padding: 24rpx;
}
</style>
