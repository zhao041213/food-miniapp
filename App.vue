<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 初始化云开发环境
			if (wx.cloud) {
				wx.cloud.init({
					env: 'cloud1-d0giwawspff81411b',
					traceUser: true
				})
				console.log('云开发初始化成功')
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	page {
		background-color: #f5f5f5;
	}
</style>
