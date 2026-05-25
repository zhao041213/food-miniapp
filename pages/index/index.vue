<template>
	<view class="container">
		<!-- 遮罩层 -->
		<view v-if="showHistory && searchHistory.length > 0" class="mask" @click="showHistory = false"></view>

		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input">
				<text class="search-icon">🔍</text>
				<input
					v-model="searchKeyword"
					placeholder="搜索店内商品"
					placeholder-class="search-placeholder"
					@focus="showHistory = true"
					@input="onSearch"
					@confirm="onSearchConfirm"
				/>
				<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
			</view>

			<!-- 搜索历史 -->
			<view v-if="showHistory && searchHistory.length > 0" class="search-history">
				<view class="history-header">
					<text class="history-title">搜索历史</text>
					<text class="clear-history" @click="clearAllHistory">清空</text>
				</view>
				<view class="history-list">
					<view
						v-for="(item, index) in searchHistory"
						:key="index"
						class="history-item"
						@click="selectHistory(item)"
					>
						<text class="history-icon">🕐</text>
						<text class="history-text">{{ item }}</text>
						<text class="delete-icon" @click.stop="deleteHistory(index)">✕</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 店铺信息 -->
		<view class="shop-info">
			<view class="shop-avatar">🍽️</view>
			<view class="shop-detail">
				<view class="shop-name">美味餐厅</view>
				<view class="shop-tags">
					<text class="shop-tag">月售 {{ totalSales }}</text>
					<text class="shop-tag">配送时间 30分钟</text>
				</view>
			</view>
		</view>

		<!-- 横幅广告 -->
		<view class="banner-section">
			<swiper class="banner-swiper" indicator-dots circular autoplay interval="3000">
				<swiper-item v-for="(banner, index) in banners" :key="index">
					<image class="banner-image" :src="banner" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>

		<!-- 分类导航 -->
		<view class="category-nav">
			<scroll-view scroll-x class="category-scroll">
				<view
					v-for="cat in categories"
					:key="cat"
					:class="['category-item', currentCategory === cat ? 'active' : '']"
					@click="selectCategory(cat)"
				>
					{{ cat }}
				</view>
			</scroll-view>
		</view>

		<!-- 菜品列表 -->
		<view class="dish-list">
			<view
				v-for="dish in displayDishes"
				:key="dish.id"
				class="dish-item"
			>
				<image :src="dish.image" class="dish-image" mode="aspectFill"></image>
				<view class="dish-info">
					<view class="dish-name">{{ dish.name }}</view>
					<view class="dish-desc">{{ dish.description }}</view>
					<view class="dish-sales">月售 {{ dish.sales || 0 }}</view>
					<view class="dish-bottom">
						<view class="dish-price">
							<text class="price-symbol">¥</text>
							<text class="price-value">{{ dish.price }}</text>
						</view>
						<view class="add-btn" @click="addToCart(dish)">
							<text class="add-icon">+</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-if="displayDishes.length === 0" class="empty-state">
			<text class="empty-icon">🍽️</text>
			<text class="empty-text">暂无相关菜品</text>
		</view>

		<!-- 购物车按钮 -->
		<view class="cart-bar" @click="goToCart">
			<view class="cart-info">
				<view class="cart-icon-wrap">
					<text class="cart-icon">🛒</text>
					<view v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</view>
				</view>
				<view class="cart-price">¥{{ totalPrice }}</view>
			</view>
			<view class="cart-btn">去结算</view>
		</view>
	</view>
</template>

<script>
import api from '@/utils/api.js'
import storage from '@/utils/storage.js'

export default {
	data() {
		return {
			dishes: [],
			cart: [],
			categories: ['全部', '热菜', '凉菜', '主食', '汤类'],
			currentCategory: '全部',
			searchKeyword: '',
			searchHistory: [],
			showHistory: false,
			banners: [],
			bannerCloudPaths: [
				'cloud://cloud1-d0giwawspff81411b.636c-cloud1-d0giwawspff81411b-1429623183/banners/banner.png',
				'cloud://cloud1-d0giwawspff81411b.636c-cloud1-d0giwawspff81411b-1429623183/banners/png2.png',
				'cloud://cloud1-d0giwawspff81411b.636c-cloud1-d0giwawspff81411b-1429623183/banners/png4.png'
			]
		}
	},
	computed: {
		filteredDishes() {
			if (this.currentCategory === '全部') {
				return this.dishes
			}
			return this.dishes.filter(dish => dish.category === this.currentCategory)
		},
		displayDishes() {
			let result = this.filteredDishes
			if (this.searchKeyword.trim()) {
				const keyword = this.searchKeyword.trim().toLowerCase()
				result = result.filter(dish =>
					dish.name.toLowerCase().includes(keyword) ||
					dish.description.toLowerCase().includes(keyword)
				)
			}
			return result
		},
		totalSales() {
			return this.dishes.reduce((sum, dish) => sum + (dish.sales || 0), 0)
		},
		cartCount() {
			return this.cart.reduce((sum, item) => sum + item.count, 0)
		},
		totalPrice() {
			return this.cart.reduce((sum, item) => sum + item.price * item.count, 0)
		}
	},
	onLoad() {
		this.loadData()
		this.loadSearchHistory()
	},
	onShow() {
		this.loadData()
	},
	methods: {
		async loadData() {
			try {
				// 通过云函数转换横幅图片
				if (this.bannerCloudPaths.length > 0) {
					try {
						const bannerRes = await api.dishes.getBanners(this.bannerCloudPaths)
						if (bannerRes.success) {
							this.banners = bannerRes.data
						}
					} catch (error) {
						console.error('获取横幅图片失败:', error)
					}
				}

				// 从后端获取菜品（只获取已上架的）
				const res = await api.dishes.getAll(false)
				if (res.success) {
					// 将 _id 转换为 id，并过滤已上架的菜品
					this.dishes = res.data
						.filter(dish => dish.status === 1)
						.map(dish => ({
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

			// 从本地存储获取购物车
			this.cart = storage.get('cart') || []
		},
		selectCategory(category) {
			this.currentCategory = category
		},
		onSearch() {
			// 实时搜索，逻辑已在 computed 中实现
			// 如果有搜索结果，隐藏历史记录
			if (this.searchKeyword.trim()) {
				this.showHistory = false
			}
		},
		onSearchConfirm() {
			// 用户按下确认键时保存搜索历史
			const keyword = this.searchKeyword.trim()
			if (keyword) {
				this.saveSearchHistory(keyword)
				this.showHistory = false
			}
		},
		clearSearch() {
			this.searchKeyword = ''
			this.showHistory = true
		},
		loadSearchHistory() {
			const history = storage.get('searchHistory') || []
			this.searchHistory = history
		},
		saveSearchHistory(keyword) {
			let history = storage.get('searchHistory') || []
			// 去重：如果已存在，先删除
			history = history.filter(item => item !== keyword)
			// 添加到最前面
			history.unshift(keyword)
			// 最多保存10条
			if (history.length > 10) {
				history = history.slice(0, 10)
			}
			storage.set('searchHistory', history)
			this.searchHistory = history
		},
		selectHistory(keyword) {
			this.searchKeyword = keyword
			this.showHistory = false
			this.saveSearchHistory(keyword)
		},
		deleteHistory(index) {
			this.searchHistory.splice(index, 1)
			storage.set('searchHistory', this.searchHistory)
		},
		clearAllHistory() {
			uni.showModal({
				title: '提示',
				content: '确定要清空所有搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						this.searchHistory = []
						storage.set('searchHistory', [])
						this.showHistory = false
					}
				}
			})
		},
		addToCart(dish) {
			const cart = storage.get('cart') || []
			const existItem = cart.find(item => item.id === dish.id)
			if (existItem) {
				existItem.count++
			} else {
				cart.push({...dish, count: 1})
			}
			storage.set('cart', cart)
			this.cart = cart

			uni.showToast({
				title: '已加入购物车',
				icon: 'success',
				duration: 1500
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
	padding-bottom: 120rpx;
	background: #f5f5f5;
}

/* 搜索栏 */
.search-bar {
	background: #fff;
	padding: 20rpx 30rpx;
	position: sticky;
	top: 0;
	z-index: 102;
}

.search-input {
	display: flex;
	align-items: center;
	background: #f5f5f5;
	border-radius: 30rpx;
	padding: 15rpx 25rpx;
}

.search-icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}

.search-input input {
	flex: 1;
	font-size: 28rpx;
}

.search-placeholder {
	color: #999;
}

.clear-icon {
	font-size: 32rpx;
	color: #999;
	padding: 0 10rpx;
}

/* 搜索历史 */
.search-history {
	position: absolute;
	top: 100%;
	left: 30rpx;
	right: 30rpx;
	background: #fff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
	margin-top: 10rpx;
	z-index: 103;
	max-height: 500rpx;
	overflow-y: auto;
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 25rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.history-title {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.clear-history {
	font-size: 24rpx;
	color: #999;
}

.history-list {
	padding: 10rpx 0;
}

.history-item {
	display: flex;
	align-items: center;
	padding: 20rpx 25rpx;
	transition: background 0.3s;
}

.history-item:active {
	background: #f5f5f5;
}

.history-icon {
	font-size: 28rpx;
	margin-right: 15rpx;
}

.history-text {
	flex: 1;
	font-size: 28rpx;
	color: #666;
}

.delete-icon {
	font-size: 32rpx;
	color: #ccc;
	padding: 0 10rpx;
}

/* 遮罩层 */
.mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	z-index: 101;
}

/* 店铺信息 */
.shop-info {
	display: flex;
	align-items: center;
	background: #fff;
	padding: 25rpx 30rpx;
	margin-bottom: 20rpx;
}

.shop-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 12rpx;
	background: #FFE5E5;
	margin-right: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 50rpx;
}

.shop-detail {
	flex: 1;
}

.shop-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
}

.shop-tags {
	display: flex;
	gap: 20rpx;
}

.shop-tag {
	font-size: 24rpx;
	color: #999;
}

/* 横幅 */
.banner-section {
	margin-bottom: 20rpx;
	padding: 0 30rpx;
}

.banner-swiper {
	width: 100%;
	height: 280rpx;
}

.banner-image {
	width: 100%;
	height: 100%;
	border-radius: 16rpx;
}

/* 分类导航 */
.category-nav {
	background: #fff;
	padding: 20rpx 0;
	margin-bottom: 20rpx;
}

.category-scroll {
	white-space: nowrap;
	padding: 0 20rpx;
}

.category-item {
	display: inline-block;
	padding: 12rpx 30rpx;
	font-size: 28rpx;
	color: #666;
	border-radius: 30rpx;
	margin-right: 20rpx;
	transition: all 0.3s;
}

.category-item.active {
	background: #FF6B6B;
	color: #fff;
	font-weight: bold;
}

/* 菜品列表 */
.dish-list {
	padding: 0 20rpx;
}

.dish-item {
	display: flex;
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.dish-image {
	width: 200rpx;
	height: 200rpx;
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

.dish-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.dish-desc {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.dish-sales {
	font-size: 22rpx;
	color: #999;
	margin-bottom: 8rpx;
}

.dish-bottom {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.dish-price {
	display: flex;
	align-items: baseline;
	color: #FF6B6B;
	font-weight: bold;
}

.price-symbol {
	font-size: 24rpx;
}

.price-value {
	font-size: 36rpx;
}

.add-btn {
	width: 60rpx;
	height: 60rpx;
	background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

.add-icon {
	color: #fff;
	font-size: 40rpx;
	line-height: 1;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 购物车 */
.cart-bar {
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
	z-index: 99;
}

.cart-info {
	display: flex;
	align-items: center;
}

.cart-icon-wrap {
	position: relative;
	margin-right: 20rpx;
}

.cart-icon {
	font-size: 50rpx;
}

.cart-badge {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	background: #FF6B6B;
	color: #fff;
	font-size: 20rpx;
	padding: 4rpx 8rpx;
	border-radius: 20rpx;
	min-width: 32rpx;
	text-align: center;
}

.cart-price {
	font-size: 36rpx;
	color: #FF6B6B;
	font-weight: bold;
}

.cart-btn {
	background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
	color: #fff;
	padding: 20rpx 50rpx;
	border-radius: 50rpx;
	font-size: 28rpx;
	font-weight: bold;
}
</style>
