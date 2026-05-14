// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: 'cloud1-d0giwawspff81411b'
})

const db = cloud.database()

// 微信小程序配置
const APPID = 'wx95e0bd4dcf324804'
const APPSECRET = '7dd808540a8798511b0ed16565a8a812'

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    // 微信授权登录
    case 'wechatLogin':
      try {
        // 使用 code 换取 openid 和 session_key
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APPSECRET}&js_code=${data.code}&grant_type=authorization_code`

        const response = await axios.get(url)
        const { openid, session_key, errcode, errmsg } = response.data

        if (errcode) {
          return {
            success: false,
            message: errmsg || '微信登录失败'
          }
        }

        // 查询用户是否已存在
        const existingUser = await db.collection('users').where({
          openid: openid
        }).get()

        let userData

        if (existingUser.data.length > 0) {
          // 用户已存在，直接返回
          userData = existingUser.data[0]
        } else {
          // 新用户，创建账号
          const result = await db.collection('users').add({
            data: {
              openid: openid,
              name: '微信用户',
              avatar: '/static/avatar.png',
              role: 'user',
              createTime: db.serverDate()
            }
          })

          // 获取新创建的用户信息
          const newUser = await db.collection('users').doc(result._id).get()
          userData = newUser.data
        }

        delete userData.password

        return {
          success: true,
          message: '登录成功',
          data: userData
        }
      } catch (error) {
        console.error('微信登录错误:', error)
        return {
          success: false,
          message: '微信登录失败，请重试'
        }
      }

    // 用户登录
    case 'login':
      const user = await db.collection('users').where({
        phone: data.phone,
        password: data.password
      }).get()

      if (user.data.length === 0) {
        return {
          success: false,
          message: '账号或密码错误'
        }
      }

      const userData = user.data[0]
      delete userData.password // 不返回密码

      return {
        success: true,
        message: '登录成功',
        data: userData
      }

    // 用户注册
    case 'register':
      // 检查手机号是否已存在
      const existing = await db.collection('users').where({
        phone: data.phone
      }).get()

      if (existing.data.length > 0) {
        return {
          success: false,
          message: '该手机号已注册'
        }
      }

      const result = await db.collection('users').add({
        data: {
          phone: data.phone,
          password: data.password,
          name: data.name,
          avatar: '/static/avatar.png',
          role: 'user',
          createTime: db.serverDate()
        }
      })

      return {
        success: true,
        message: '注册成功',
        data: {
          _id: result._id,
          phone: data.phone,
          name: data.name,
          role: 'user'
        }
      }

    // 获取用户信息
    case 'getInfo':
      const userInfo = await db.collection('users').doc(data.id).get()
      if (userInfo.data) {
        delete userInfo.data.password
      }
      return {
        success: true,
        data: userInfo.data
      }

    // 更新用户资料
    case 'updateProfile':
      try {
        const { id, name, avatar } = data
        await db.collection('users').doc(id).update({
          data: {
            name: name,
            avatar: avatar
          }
        })
        return {
          success: true,
          message: '资料更新成功'
        }
      } catch (error) {
        console.error('更新资料失败:', error)
        return {
          success: false,
          message: '更新失败'
        }
      }

    default:
      return { success: false, message: '未知操作' }
  }
}
