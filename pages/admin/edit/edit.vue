<template>
	<view class="container">
		<view class="form">
			<view class="form-item">
				<text class="form-label">菜品名称</text>
				<input class="form-input" v-model="form.name" placeholder="请输入菜品名称" />
			</view>

			<view class="form-item">
				<text class="form-label">价格</text>
				<input class="form-input" v-model.number="form.price" type="digit" placeholder="请输入价格" />
			</view>

			<view class="form-item">
				<text class="form-label">分类</text>
				<picker :value="categoryIndex" :range="categories" @change="onCategoryChange">
					<view class="picker">
						{{ form.category || '请选择分类' }}
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">描述</text>
				<textarea class="form-textarea" v-model="form.description" placeholder="请输入菜品描述" />
			</view>

			<view class="form-item">
				<text class="form-label">图片</text>
				<view class="image-upload" @click="chooseImage">
					<image v-if="form.image" :src="form.image" class="preview-image" mode="aspectFill"></image>
					<view v-else class="upload-placeholder">
						<text class="upload-icon">+</text>
						<text class="upload-text">点击上传图片</text>
					</view>
				</view>
			</view>

			<view class="form-btns">
				<view class="form-btn cancel" @click="cancel">取消</view>
				<view class="form-btn confirm" @click="save">保存</view>
			</view>
		</view>
	</view>
</template>

<script>
import api from '@/utils/api.js'

export default {
	data() {
		return {
			dishId: null,
			form: {
				name: '',
				price: '',
				category: '',
				description: '',
				image: ''
			},
			categories: ['热菜', '凉菜', '主食', '汤类'],
			categoryIndex: 0
		}
	},
	onLoad(options) {
		if (options.id) {
			this.dishId = parseInt(options.id)
			this.loadDish()
		}
	},
	methods: {
		async loadDish() {
			try {
				const res = await api.dishes.getById(this.dishId)
				if (res.success) {
					this.form = { ...res.data }
					this.categoryIndex = this.categories.indexOf(res.data.category)
				}
			} catch (error) {
				console.error('获取菜品失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		async chooseImage() {
			try {
				// 选择图片
				const chooseResult = await uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera']
				})

				const tempFilePath = chooseResult[1].tempFilePaths[0]

				// 显示上传中
				uni.showLoading({
					title: '上传中...'
				})

				// 上传到云存储
				const uploadResult = await wx.cloud.uploadFile({
					cloudPath: `dishes/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
					filePath: tempFilePath
				})

				uni.hideLoading()

				// 更新表单图片地址
				this.form.image = uploadResult.fileID

				uni.showToast({
					title: '上传成功',
					icon: 'success'
				})
			} catch (error) {
				uni.hideLoading()
				console.error('上传图片失败:', error)
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
			}
		},
		onCategoryChange(e) {
			this.categoryIndex = e.detail.value
			this.form.category = this.categories[e.detail.value]
		},
		validate() {
			if (!this.form.name) {
				uni.showToast({
					title: '请输入菜品名称',
					icon: 'none'
				})
				return false
			}
			if (!this.form.price || this.form.price <= 0) {
				uni.showToast({
					title: '请输入正确的价格',
					icon: 'none'
				})
				return false
			}
			if (!this.form.category) {
				uni.showToast({
					title: '请选择分类',
					icon: 'none'
				})
				return false
			}
			if (!this.form.description) {
				uni.showToast({
					title: '请输入描述',
					icon: 'none'
				})
				return false
			}
			return true
		},
		async save() {
			if (!this.validate()) {
				return
			}

			try {
				if (this.dishId) {
					// 编辑
					const res = await api.dishes.update(this.dishId, this.form)
					if (res.success) {
						uni.showToast({
							title: '更新成功',
							icon: 'success'
						})
					}
				} else {
					// 新增
					const res = await api.dishes.create(this.form)
					if (res.success) {
						uni.showToast({
							title: '添加成功',
							icon: 'success'
						})
					}
				}

				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (error) {
				console.error('保存失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			}
		},
		cancel() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	padding: 20rpx;
}

.form {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
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

.form-textarea {
	width: 100%;
	min-height: 150rpx;
	border: 1rpx solid #e0e0e0;
	border-radius: 8rpx;
	padding: 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.picker {
	height: 80rpx;
	line-height: 80rpx;
	border: 1rpx solid #e0e0e0;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: #333;
}

.image-upload {
	border: 1rpx dashed #e0e0e0;
	border-radius: 8rpx;
	padding: 20rpx;
	text-align: center;
}

.preview-image {
	width: 200rpx;
	height: 200rpx;
	border-radius: 8rpx;
	background: #f0f0f0;
	margin-bottom: 20rpx;
}

.upload-tip {
	font-size: 24rpx;
	color: #999;
}

.form-btns {
	display: flex;
	margin-top: 50rpx;
}

.form-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	border-radius: 8rpx;
	font-size: 30rpx;
}

.form-btn.cancel {
	background: #f0f0f0;
	color: #666;
	margin-right: 20rpx;
}

.form-btn.confirm {
	background: #3cc51f;
	color: #fff;
}
</style>
