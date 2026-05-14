// 上传菜品图片到云存储的脚本
// 使用方法：在微信开发者工具的云函数目录中创建临时云函数运行此脚本

const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')

cloud.init({
  env: 'cloud1-d0giwawspff81411b'
})

const db = cloud.database()

// 菜品数据（包含图片URL占位符）
const dishes = [
  // 热菜
  { name: '宫保鸡丁', category: '热菜', price: 38, description: '经典川菜，鸡肉鲜嫩，花生酥脆', image: '' },
  { name: '鱼香肉丝', category: '热菜', price: 32, description: '酸甜可口，色泽红亮', image: '' },
  { name: '红烧肉', category: '热菜', price: 45, description: '肥而不腻，入口即化', image: '' },
  { name: '麻婆豆腐', category: '热菜', price: 28, description: '麻辣鲜香，豆腐嫩滑', image: '' },

  // 凉菜
  { name: '凉拌黄瓜', category: '凉菜', price: 15, description: '清爽开胃，酸辣适中', image: '' },
  { name: '口水鸡', category: '凉菜', price: 35, description: '麻辣鲜香，鸡肉滑嫩', image: '' },
  { name: '拍黄瓜', category: '凉菜', price: 12, description: '简单美味，清脆爽口', image: '' },
  { name: '凉拌木耳', category: '凉菜', price: 18, description: '营养丰富，口感脆嫩', image: '' },

  // 主食
  { name: '扬州炒饭', category: '主食', price: 25, description: '粒粒分明，配料丰富', image: '' },
  { name: '牛肉面', category: '主食', price: 30, description: '汤浓肉烂，面条劲道', image: '' },
  { name: '小笼包', category: '主食', price: 20, description: '皮薄馅大，汤汁鲜美', image: '' },
  { name: '炒面', category: '主食', price: 22, description: '面条爽滑，酱香浓郁', image: '' },

  // 汤类
  { name: '西红柿蛋汤', category: '汤类', price: 18, description: '酸甜可口，营养丰富', image: '' },
  { name: '紫菜蛋花汤', category: '汤类', price: 15, description: '清淡鲜美，简单营养', image: '' },
  { name: '酸辣汤', category: '汤类', price: 20, description: '酸辣开胃，浓稠鲜香', image: '' },
  { name: '玉米排骨汤', category: '汤类', price: 35, description: '汤鲜味美，营养滋补', image: '' }
]

// 使用在线占位图服务生成图片URL
// 你可以替换为真实的菜品图片
function generateImageUrl(dishName, index) {
  // 使用 placeholder 图片服务
  // 尺寸: 400x300
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F']
  const color = colors[index % colors.length]

  // 返回占位图URL（实际使用时应该上传真实图片到云存储）
  return `https://via.placeholder.com/400x300/${color}/FFFFFF?text=${encodeURIComponent(dishName)}`
}

// 主函数
exports.main = async (event, context) => {
  try {
    console.log('开始上传菜品数据...')

    // 为每个菜品生成图片URL
    const dishesWithImages = dishes.map((dish, index) => ({
      ...dish,
      image: generateImageUrl(dish.name, index),
      status: 1, // 默认上架
      createTime: new Date()
    }))

    // 批量插入数据库
    const result = await db.collection('dishes').add({
      data: dishesWithImages
    })

    console.log('上传成功！', result)

    return {
      success: true,
      message: '菜品数据上传成功',
      count: dishesWithImages.length
    }
  } catch (error) {
    console.error('上传失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
