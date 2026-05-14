<template>
	<view class="container">
		<view class="header">
			<view class="add-btn" @click="addDish">+ 添加菜品</view>
		</view>

		<view v-if="dishes.length === 0" class="empty">
			<text class="empty-icon">🍽️</text>
			<text class="empty-text">暂无菜品</text>
		</view>

			<view v-else class="dish-list">
				<view v-for="dish in dishes" :key="dish.id" class="dish-item">
					<image :src="dish.image" class="dish-image" mode="aspectFill"></image>
					<view class="dish-info">
						<view class="dish-header">
							<view class="dish-name">{{ dish.name }}</view>
							<view :class="['dish-status', dish.status === 1 ? 'active' : 'inactive']">
								{{ dish.status === 1 ? '已上架' : '已下架' }}
							</view>
						</view>
						<view class="dish-category">{{ dish.category }}</view>
						<view class="dish-desc">{{ dish.description }}</view>
						<view class="dish-price">¥{{ dish.price }}</view>
					</view>
					<view class="dish-actions">
						<view :class="['action-btn', dish.status === 1 ? 'offline' : 'online']" @click="toggleStatus(dish)">
							{{ dish.status === 1 ? '下架' : '上架' }}
						</view>
						<view class="action-btn edit" @click="editDish(dish)">编辑</view>
						<view class="action-btn delete" @click="deleteDish(dish)">删除</view>
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
			dishes: []
		}
	},
	onShow() {
		this.checkAuth()
		this.loadDishes()
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
					uni.switchTab({
						url: '/pages/mine/mine'
					})
				}, 1500)
			}
		},
		async loadDishes() {
			try {
				// 管理端获取所有菜品（包括已下架）
				const res = await api.dishes.getAll(true)
				if (res.success) {
					// 将 _id 转换为 id
					this.dishes = res.data.map(dish => ({
						...dish,
						id: dish._id
					}))
				}
			} catch (error) {
				console.error('获取菜品失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		async toggleStatus(dish) {
			const newStatus = dish.status === 1 ? 0 : 1
			const actionText = newStatus === 1 ? '上架' : '下架'

			uni.showModal({
				title: '确认',
				content: `确定要${actionText}"${dish.name}"吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							// 只传递需要更新的字段
							const result = await api.dishes.update(dish.id, {
								status: newStatus
							})
							if (result.success) {
								this.loadDishes()
								uni.showToast({
									title: `${actionText}成功`,
									icon: 'success'
								})
							}
						} catch (error) {
							console.error('操作失败:', error)
							uni.showToast({
								title: '操作失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		addDish() {
			uni.navigateTo({
				url: '/pages/admin/edit/edit'
			})
		},
		editDish(dish) {
			uni.navigateTo({
				url: `/pages/admin/edit/edit?id=${dish.id}`
			})
		},
		deleteDish(dish) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除"${dish.name}"吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const result = await api.dishes.delete(dish.id)
							if (result.success) {
								this.loadDishes()
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
							}
						} catch (error) {
							console.error('删除失败:', error)
							uni.showToast({
								title: '删除失败',
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

.header {
	margin-bottom: 20rpx;
}

.add-btn {
	background: #3cc51f;
	color: #fff;
	text-align: center;
	padding: 25rpx;
	border-radius: 16rpx;
	font-size: 32rpx;
	font-weight: bold;
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

.dish-list {
	padding-bottom: 20rpx;
}

.dish-item {
	display: flex;
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08);
}

.dish-image {
	width: 150rpx;
	height: 150rpx;
	border-radius: 12rpx;
	background: #f0f0f0;
	flex-shrink: 0;
}

.dish-info {
	flex: 1;
	margin-left: 20rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.dish-header {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.dish-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.dish-status {
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
}

.dish-status.active {
	background: #e8f5e9;
	color: #4caf50;
}

.dish-status.inactive {
	background: #ffebee;
	color: #f44336;
}

.dish-category {
	display: inline-block;
	background: #e8f5e9;
	color: #4caf50;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
	margin-top: 8rpx;
	align-self: flex-start;
}

.dish-desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.dish-price {
	font-size: 36rpx;
	color: #ff6b6b;
	font-weight: bold;
	margin-top: 8rpx;
}

.dish-actions {
	display: flex;
	flex-direction: column;
	justify-content: center;
	margin-left: 20rpx;
}

.action-btn {
	padding: 15rpx 25rpx;
	border-radius: 8rpx;
	font-size: 26rpx;
	text-align: center;
	margin-bottom: 15rpx;
}

.action-btn:last-child {
	margin-bottom: 0;
}

.action-btn.online {
	background: #4caf50;
	color: #fff;
}

.action-btn.offline {
	background: #ff9800;
	color: #fff;
}

.action-btn.edit {
	background: #2196f3;
	color: #fff;
}

.action-btn.delete {
	background: #ff6b6b;
	color: #fff;
}
</style>
