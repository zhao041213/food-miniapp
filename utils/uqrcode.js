/**
 * 二维码生成工具
 * 基于 canvas 绘制二维码
 */

// 主函数
function make(options) {
	const {
		canvasId,
		text,
		size = 200,
		margin = 10,
		backgroundColor = '#ffffff',
		foregroundColor = '#000000',
		success,
		fail
	} = options

	try {
		// 使用在线二维码生成 API
		const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`

		console.log('二维码URL:', qrcodeUrl)

		// 下载二维码图片并绘制到 canvas
		uni.downloadFile({
			url: qrcodeUrl,
			success: (res) => {
				console.log('下载二维码成功:', res)
				if (res.statusCode === 200) {
					// 获取 canvas 上下文
					const ctx = uni.createCanvasContext(canvasId)
					ctx.drawImage(res.tempFilePath, 0, 0, size, size)
					ctx.draw(false, () => {
						console.log('绘制二维码成功')
						if (success) success()
					})
				} else {
					console.error('下载二维码失败，状态码:', res.statusCode)
					if (fail) fail(new Error('下载二维码失败'))
				}
			},
			fail: (err) => {
				console.error('下载二维码失败:', err)
				if (fail) fail(err)
			}
		})
	} catch (error) {
		console.error('生成二维码异常:', error)
		if (fail) fail(error)
	}
}

module.exports = {
	make
}
