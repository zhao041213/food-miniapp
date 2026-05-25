<template>
	<view class="container">
		<!-- 用户信息 -->
		<view class="user-section">
			<view v-if="isLogin" class="user-info">
				<image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
				<view class="user-detail">
					<view class="username">{{ userInfo.name }}</view>
					<view class="user-phone">{{ userInfo.phone }}</view>
				</view>
			</view>
			<view v-else class="login-tip" @click="showLoginModal">
				<text class="login-icon">👤</text>
				<text class="login-text">点击登录</text>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-item" @click="goToOrders">
				<text class="menu-icon">📋</text>
				<text class="menu-text">我的订单</text>
				<text class="menu-arrow">›</text>
			</view>
			<view v-if="isAdmin" class="menu-item" @click="goToAdmin">
				<text class="menu-icon">⚙️</text>
				<text class="menu-text">菜品管理</text>
				<text class="menu-arrow">›</text>
			</view>
			<view v-if="isAdmin" class="menu-item" @click="goToOrderManage">
				<text class="menu-icon">📦</text>
				<text class="menu-text">订单管理</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>

		<!-- 退出登录 -->
		<view v-if="isLogin" class="logout-section">
			<view class="logout-btn" @click="logout">退出登录</view>
		</view>

		<!-- 登录弹窗 -->
		<view v-if="showLogin" class="modal-mask" @click="hideLoginModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">{{ showPhoneLogin ? '手机号登录' : '登录' }}</view>

				<!-- 微信授权登录 -->
				<view v-if="!showPhoneLogin" class="wechat-login">
					<view class="wechat-btn" @click="handleWechatLogin">
						<text class="wechat-icon">💬</text>
						<text class="wechat-text">微信授权登录</text>
					</view>
					<view class="login-divider">
						<view class="divider-line"></view>
						<text class="divider-text">或</text>
						<view class="divider-line"></view>
					</view>
					<view class="phone-login-link" @click="showPhoneLogin = true">
						<text>手机号登录（管理员）</text>
					</view>
				</view>

				<!-- 手机号登录 -->
				<view v-else class="phone-login">
					<view class="form-item">
						<text class="form-label">手机号</text>
						<input class="form-input" v-model="loginForm.phone" type="number" maxlength="11" placeholder="请输入手机号" />
					</view>
					<view class="form-item">
						<text class="form-label">密码</text>
						<input class="form-input" v-model="loginForm.password" type="password" placeholder="请输入密码" />
					</view>
					<view class="form-tip">管理员账号: 10000 密码: 123456</view>
					<view class="modal-btns">
						<view class="modal-btn cancel" @click="showPhoneLogin = false">返回</view>
						<view class="modal-btn confirm" @click="handleLogin">登录</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 完善资料弹窗 -->
		<view v-if="showProfileModal" class="modal-mask">
			<view class="modal-content" @click.stop>
				<view class="modal-title">完善资料</view>
				<view class="profile-form">
					<view class="avatar-section">
						<text class="form-label">选择头像</text>
						<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
							<image :src="profileForm.avatar" class="avatar-preview" mode="aspectFill"></image>
							<text class="avatar-tip">点击选择</text>
						</button>
					</view>
					<view class="form-item">
						<text class="form-label">输入昵称</text>
						<input
							class="form-input nickname-input"
							type="nickname"
							v-model="profileForm.name"
							placeholder="请输入昵称"
							maxlength="20"
						/>
					</view>
					<view class="modal-btns">
						<view class="modal-btn confirm full" @click="handleCompleteProfile">完成</view>
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
			isLogin: false,
			isAdmin: false,
			userInfo: {
				name: '',
				phone: '',
				avatar: '/static/avatar.png'
			},
			showLogin: false,
			showPhoneLogin: false,
			showProfileModal: false,
			loginForm: {
				phone: '',
				password: ''
			},
			profileForm: {
				name: '',
				avatar: '/static/avatar.png',
				avatarFile: null
			}
		}
	},
	onShow() {
		this.checkLogin()
	},
	methods: {
		checkLogin() {
			const user = storage.get('userInfo')
			if (user) {
				this.isLogin = true
				this.userInfo = user
				this.isAdmin = user.role === 'admin'
			} else {
				this.isLogin = false
				this.isAdmin = false
			}
		},
		showLoginModal() {
			this.showLogin = true
		},
		hideLoginModal() {
			this.showLogin = false
			this.showPhoneLogin = false
			this.loginForm = {
				phone: '',
				password: ''
			}
		},
		async handleWechatLogin() {
			try {
				uni.showLoading({
					title: '登录中...'
				})

				// 调用微信登录获取code
				const loginRes = await new Promise((resolve, reject) => {
					wx.login({
						success: resolve,
						fail: reject
					})
				})

				if (!loginRes.code) {
					throw new Error('获取登录凭证失败')
				}

				// 调用云函数进行微信登录
				const res = await api.users.wechatLogin(loginRes.code)

				uni.hideLoading()

				if (res.success) {
					const user = res.data
					storage.set('userInfo', user)
					this.isLogin = true
					this.userInfo = user
					this.isAdmin = user.role === 'admin'
					this.hideLoginModal()

					// 检查是否需要完善资料
					if (user.name === '微信用户') {
						this.profileForm.name = ''
						this.profileForm.avatar = '/static/avatar.png'
						this.profileForm.avatarFile = null
						this.showProfileModal = true
					} else {
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})
					}
				}
			} catch (error) {
				uni.hideLoading()
				console.error('微信登录失败:', error)
				uni.showToast({
					title: error.message || '登录失败',
					icon: 'none'
				})
			}
		},
		onChooseAvatar(e) {
			const { avatarUrl } = e.detail
			this.profileForm.avatar = avatarUrl
			this.profileForm.avatarFile = avatarUrl
		},
		async handleCompleteProfile() {
			if (!this.profileForm.name || !this.profileForm.name.trim()) {
				uni.showToast({
					title: '请输入昵称',
					icon: 'none'
				})
				return
			}

			try {
				uni.showLoading({
					title: '保存中...'
				})

				let avatarUrl = this.profileForm.avatar

				// 如果用户选择了新头像，上传到云存储
				if (this.profileForm.avatarFile && this.profileForm.avatarFile !== '/static/avatar.png') {
					const uploadRes = await wx.cloud.uploadFile({
						cloudPath: `avatars/${this.userInfo._id}_${Date.now()}.png`,
						filePath: this.profileForm.avatarFile
					})
					avatarUrl = uploadRes.fileID
				}

				// 更新用户信息
				const res = await api.users.updateProfile(this.userInfo._id, {
					name: this.profileForm.name.trim(),
					avatar: avatarUrl
				})

				uni.hideLoading()

				if (res.success) {
					// 更新本地用户信息
					this.userInfo.name = this.profileForm.name.trim()
					this.userInfo.avatar = avatarUrl
					storage.set('userInfo', this.userInfo)

					this.showProfileModal = false

					uni.showToast({
						title: '资料完善成功',
						icon: 'success'
					})
				}
			} catch (error) {
				uni.hideLoading()
				console.error('保存资料失败:', error)
				uni.showToast({
					title: '保存失败，请重试',
					icon: 'none'
				})
			}
		},
		async handleLogin() {
			const { phone, password } = this.loginForm

			if (!phone) {
				uni.showToast({
					title: '请输入手机号',
					icon: 'none'
				})
				return
			}

			if (!password) {
				uni.showToast({
					title: '请输入密码',
					icon: 'none'
				})
				return
			}

			try {
				const res = await api.users.login(phone, password)

				if (res.success) {
					const user = res.data
					storage.set('userInfo', user)
					this.isLogin = true
					this.userInfo = user
					this.isAdmin = user.role === 'admin'
					this.hideLoginModal()

					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
				}
			} catch (error) {
				console.error('登录失败:', error)
				uni.showToast({
					title: error.message || '账号或密码错误',
					icon: 'none'
				})
			}
		},
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						storage.remove('userInfo')
						this.isLogin = false
						this.isAdmin = false
						this.userInfo = {
							name: '',
							phone: '',
							avatar: '/static/avatar.png'
						}
						uni.showToast({
							title: '已退出登录',
							icon: 'success'
						})
					}
				}
			})
		},
		goToOrders() {
			uni.switchTab({
				url: '/pages/order/order'
			})
		},
		goToAdmin() {
			if (!this.isAdmin) {
				uni.showToast({
					title: '无权限访问',
					icon: 'none'
				})
				return
			}
			uni.navigateTo({
				url: '/pages/admin/admin'
			})
		},
		goToOrderManage() {
			if (!this.isAdmin) {
				uni.showToast({
					title: '无权限访问',
					icon: 'none'
				})
				return
			}
			uni.navigateTo({
				url: '/pages/admin/orderManage'
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

.user-section {
	background: #fff;
	padding: 40rpx 30rpx;
	margin-bottom: 20rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: #f0f0f0;
}

.user-detail {
	margin-left: 30rpx;
}

.username {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.user-phone {
	font-size: 28rpx;
	color: #999;
}

.login-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx 0;
}

.login-icon {
	font-size: 80rpx;
	margin-right: 20rpx;
}

.login-text {
	font-size: 32rpx;
	color: #666;
}

.menu-section {
	background: #fff;
	margin-bottom: 20rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #333;
}

.menu-arrow {
	font-size: 40rpx;
	color: #ccc;
}

.logout-section {
	padding: 30rpx;
}

.logout-btn {
	background: #fff;
	color: #ff6b6b;
	text-align: center;
	padding: 30rpx;
	border-radius: 16rpx;
	font-size: 32rpx;
}

.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.modal-content {
	width: 600rpx;
	background: #fff;
	border-radius: 16rpx;
	padding: 40rpx;
}

.modal-title {
	font-size: 36rpx;
	font-weight: bold;
	text-align: center;
	margin-bottom: 40rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 15rpx;
}

.form-input {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #e0e0e0;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.form-tip {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 10rpx;
}

.modal-btns {
	display: flex;
	margin-top: 40rpx;
}

.modal-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	border-radius: 8rpx;
	font-size: 30rpx;
}

.modal-btn.cancel {
	background: #f0f0f0;
	color: #666;
	margin-right: 20rpx;
}

.modal-btn.confirm {
	background: #3cc51f;
	color: #fff;
}

.wechat-login {
	padding: 20rpx 0;
}

.wechat-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	background: #07c160;
	color: #fff;
	height: 90rpx;
	border-radius: 8rpx;
	font-size: 32rpx;
	margin-bottom: 30rpx;
}

.wechat-icon {
	font-size: 40rpx;
	margin-right: 15rpx;
}

.wechat-text {
	font-weight: bold;
}

.login-divider {
	display: flex;
	align-items: center;
	margin: 30rpx 0;
}

.divider-line {
	flex: 1;
	height: 1rpx;
	background: #e0e0e0;
}

.divider-text {
	padding: 0 20rpx;
	font-size: 24rpx;
	color: #999;
}

.phone-login-link {
	text-align: center;
	color: #3cc51f;
	font-size: 28rpx;
	padding: 20rpx 0;
}

.phone-login {
	padding-top: 20rpx;
}

.profile-form {
	padding: 20rpx 0;
}

.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 40rpx;
}

.avatar-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: transparent;
	border: none;
	padding: 0;
	margin-top: 20rpx;
}

.avatar-btn::after {
	border: none;
}

.avatar-preview {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: #f0f0f0;
	border: 2rpx solid #e0e0e0;
}

.avatar-tip {
	font-size: 24rpx;
	color: #999;
	margin-top: 15rpx;
}

.nickname-input {
	text-align: left;
}

.modal-btn.full {
	margin-right: 0;
}
</style>
