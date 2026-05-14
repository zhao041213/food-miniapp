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
    // 获取所有菜品
    case 'getAll':
      // 如果传入 includeInactive 参数，则返回所有菜品（包括已下架）
      const query = data.includeInactive ? {} : { status: 1 }
      const result = await db.collection('dishes').where(query).get()

      // 转换云存储图片为临时链接
      const dishes = result.data
      const cloudImages = dishes
        .filter(dish => dish.image && dish.image.startsWith('cloud://'))
        .map(dish => dish.image)

      if (cloudImages.length > 0) {
        try {
          const tempResult = await cloud.getTempFileURL({
            fileList: cloudImages
          })

          // 创建映射表
          const urlMap = {}
          tempResult.fileList.forEach(item => {
            if (item.tempFileURL) {
              urlMap[item.fileID] = item.tempFileURL
            }
          })

          // 更新菜品图片URL
          dishes.forEach(dish => {
            if (dish.image && urlMap[dish.image]) {
              dish.image = urlMap[dish.image]
            }
          })
        } catch (error) {
          console.error('获取图片临时链接失败:', error)
        }
      }

      return { data: dishes }

    // 获取单个菜品
    case 'getById':
      const dishResult = await db.collection('dishes').doc(data.id).get()
      const dish = dishResult.data

      // 转换云存储图片为临时链接
      if (dish.image && dish.image.startsWith('cloud://')) {
        try {
          const tempResult = await cloud.getTempFileURL({
            fileList: [dish.image]
          })
          if (tempResult.fileList && tempResult.fileList[0]) {
            dish.image = tempResult.fileList[0].tempFileURL
          }
        } catch (error) {
          console.error('获取图片临时链接失败:', error)
        }
      }

      return { data: dish }

    // 添加菜品
    case 'create':
      return await db.collection('dishes').add({
        data: {
          ...data,
          status: 1,
          createTime: db.serverDate()
        }
      })

    // 更新菜品
    case 'update':
      const { id, ...updateData } = data
      return await db.collection('dishes').doc(id).update({
        data: updateData
      })

    // 删除菜品
    case 'delete':
      return await db.collection('dishes').doc(data.id).remove()

    // 获取横幅图片临时链接
    case 'getBanners':
      try {
        const { fileList } = data
        if (!fileList || fileList.length === 0) {
          return { success: false, message: '文件列表为空' }
        }

        const tempResult = await cloud.getTempFileURL({
          fileList: fileList
        })

        return {
          success: true,
          data: tempResult.fileList.map(item => item.tempFileURL || item.fileID)
        }
      } catch (error) {
        console.error('获取横幅图片失败:', error)
        return { success: false, message: error.message }
      }

    default:
      return { success: false, message: '未知操作' }
  }
}
