// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-d0giwawspff81411b'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    // 批量更新现有菜品的图片（使用占位图）
    case 'updateWithPlaceholder':
      try {
        // 获取所有现有菜品
        const result = await db.collection('dishes').get()
        const existingDishes = result.data

        if (existingDishes.length === 0) {
          return {
            success: false,
            message: '数据库中没有菜品数据，请先在管理后台添加菜品'
          }
        }

        // 为每个菜品生成占位图
        const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'E74C3C', '3498DB']
        const updatePromises = existingDishes.map((dish, index) => {
          const color = colors[index % colors.length]
          const imageUrl = `https://via.placeholder.com/400x300/${color}/FFFFFF?text=${encodeURIComponent(dish.name)}`

          return db.collection('dishes').doc(dish._id).update({
            data: {
              image: imageUrl
            }
          })
        })

        await Promise.all(updatePromises)

        return {
          success: true,
          message: '更新成功',
          count: existingDishes.length
        }
      } catch (error) {
        console.error('更新失败:', error)
        return {
          success: false,
          message: '更新失败: ' + error.message
        }
      }

    // 更新单个菜品图片（上传真实图片后使用）
    case 'updateImage':
      try {
        const { dishId, fileID } = data
        await db.collection('dishes').doc(dishId).update({
          data: {
            image: fileID
          }
        })
        return {
          success: true,
          message: '图片更新成功'
        }
      } catch (error) {
        return {
          success: false,
          message: error.message
        }
      }

    default:
      return { success: false, message: '未知操作' }
  }
}
