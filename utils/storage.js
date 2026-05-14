// 本地存储工具类
export default {
	// 保存数据
	set(key, value) {
		try {
			uni.setStorageSync(key, JSON.stringify(value));
		} catch (e) {
			console.error('存储失败', e);
		}
	},

	// 获取数据
	get(key) {
		try {
			const value = uni.getStorageSync(key);
			return value ? JSON.parse(value) : null;
		} catch (e) {
			console.error('读取失败', e);
			return null;
		}
	},

	// 删除数据
	remove(key) {
		try {
			uni.removeStorageSync(key);
		} catch (e) {
			console.error('删除失败', e);
		}
	},

	// 清空所有数据
	clear() {
		try {
			uni.clearStorageSync();
		} catch (e) {
			console.error('清空失败', e);
		}
	}
}
