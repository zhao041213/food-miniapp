// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const axios = require('axios')
const xml2js = require('xml2js')

cloud.init({
  env: 'cloud1-d0giwawspff81411b'
})

const db = cloud.database()

// 微信支付配置
const APPID = 'wx95e0bd4dcf324804'
const MCH_ID = '1112522313'
const API_KEY = '23636797657948794879647474332535'

// 生成随机字符串
function generateNonceStr() {
  return Math.random().toString(36).substr(2, 15)
}

// 生成签名
function generateSign(params) {
  // 按字典序排序，过滤空值和sign字段
  const sortedKeys = Object.keys(params).sort()
  const stringA = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== undefined && params[key] !== null && key !== 'sign')
    .map(key => `${key}=${params[key]}`)
    .join('&')

  const stringSignTemp = `${stringA}&key=${API_KEY}`

  // 打印签名字符串用于调试
  console.log('签名字符串:', stringSignTemp)

  const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase()
  console.log('生成的签名:', sign)

  return sign
}

// 对象转XML
function buildXML(obj) {
  const builder = new xml2js.Builder({
    rootName: 'xml',
    headless: true,
    cdata: true
  })
  return builder.buildObject(obj)
}

// XML转对象
async function parseXML(xml) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: true
  })
  return await parser.parseStringPromise(xml)
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  switch (action) {
    // 获取所有订单
    case 'getAll':
      const query = data.userId ? { userId: data.userId } : {}
      const ordersResult = await db.collection('orders')
        .where(query)
        .orderBy('createTime', 'desc')
        .get()

      // 获取每个订单的详情
      const ordersWithItems = await Promise.all(
        ordersResult.data.map(async (order) => {
          const itemsResult = await db.collection('order_items')
            .where({ orderId: order._id })
            .get()

          return {
            ...order,
            items: itemsResult.data.map(item => ({
              id: item._id,
              name: item.dishName,
              price: item.dishPrice,
              count: item.count,
              image: item.dishImage || ''
            }))
          }
        })
      )

      return { data: ordersWithItems }

    // 获取单个订单
    case 'getById':
      const orderDoc = await db.collection('orders').doc(data.id).get()

      if (!orderDoc.data || orderDoc.data.length === 0) {
        return {
          success: false,
          message: '订单不存在'
        }
      }

      const order = orderDoc.data[0]

      // 获取订单详情
      const itemsResult = await db.collection('order_items')
        .where({ orderId: data.id })
        .get()

      console.log('订单数据:', order)
      console.log('订单项数据:', itemsResult.data)

      return {
        success: true,
        data: {
          ...order,
          items: itemsResult.data.map(item => ({
            id: item._id,
            name: item.dishName,
            price: item.dishPrice,
            count: item.count,
            image: item.dishImage || ''
          }))
        }
      }

    // 创建订单
    case 'create':
      const orderResult = await db.collection('orders').add({
        data: {
          userId: data.userId || wxContext.OPENID,
          totalPrice: data.totalPrice,
          status: '制作中',
          payStatus: '未支付',
          createTime: db.serverDate()
        }
      })

      // 添加订单详情
      const orderId = orderResult._id
      const items = data.items.map(item => ({
        orderId: orderId,
        dishId: item.id,
        dishName: item.name,
        dishPrice: item.price,
        dishImage: item.image || '',
        count: item.count
      }))

      await db.collection('order_items').add({
        data: items
      })

      return {
        success: true,
        data: {
          id: orderId,
          ...data,
          status: '制作中',
          payStatus: '未支付'
        }
      }

    // 微信支付统一下单（小程序内支付）
    case 'unifiedOrder':
      try {
        const { orderId, totalPrice, openid } = data

        console.log('收到支付请求:', { orderId, totalPrice, openid })

        // 构建统一下单参数
        const params = {
          appid: APPID,
          mch_id: MCH_ID,
          nonce_str: generateNonceStr(),
          body: '微信点餐-订单支付',
          out_trade_no: orderId,
          total_fee: Math.round(totalPrice * 100), // 转换为分
          spbill_create_ip: '127.0.0.1',
          notify_url: 'https://cloud1-d0giwawspff81411b.service.tcloudbase.com/payCallback',
          trade_type: 'JSAPI',
          openid: openid
        }

        console.log('统一下单参数:', params)

        // 生成签名
        params.sign = generateSign(params)

        console.log('最终参数（含签名）:', params)

        // 转换为XML
        const xmlData = buildXML(params)
        console.log('请求XML:', xmlData)

        // 调用微信统一下单接口
        const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
          headers: { 'Content-Type': 'application/xml' }
        })

        console.log('微信返回:', response.data)

        // 解析返回的XML
        const result = await parseXML(response.data)
        const xmlResult = result.xml

        console.log('解析后的结果:', xmlResult)

        if (xmlResult.return_code !== 'SUCCESS' || xmlResult.result_code !== 'SUCCESS') {
          console.error('支付失败:', xmlResult)
          return {
            success: false,
            message: xmlResult.return_msg || xmlResult.err_code_des || '支付失败'
          }
        }

        // 生成前端支付参数
        const payParams = {
          timeStamp: String(Math.floor(Date.now() / 1000)),
          nonceStr: generateNonceStr(),
          package: `prepay_id=${xmlResult.prepay_id}`,
          signType: 'MD5'
        }

        // 生成前端支付签名
        const paySign = generateSign({
          appId: APPID,
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType
        })

        return {
          success: true,
          data: {
            ...payParams,
            paySign: paySign
          }
        }
      } catch (error) {
        console.error('统一下单失败:', error)
        return {
          success: false,
          message: '支付失败，请重试'
        }
      }

    // 生成Native支付二维码
    case 'generateQRCode':
      try {
        const { orderId, totalPrice } = data

        console.log('生成二维码请求:', { orderId, totalPrice })

        // 构建统一下单参数（Native支付）
        const params = {
          appid: APPID,
          mch_id: MCH_ID,
          nonce_str: generateNonceStr(),
          body: '微信点餐-订单支付',
          out_trade_no: orderId,
          total_fee: Math.round(totalPrice * 100), // 转换为分
          spbill_create_ip: '127.0.0.1',
          notify_url: 'https://cloud1-d0giwawspff81411b.service.tcloudbase.com/payCallback',
          trade_type: 'NATIVE',
          product_id: orderId
        }

        console.log('Native支付参数:', params)

        // 生成签名
        params.sign = generateSign(params)

        // 转换为XML
        const xmlData = buildXML(params)
        console.log('请求XML:', xmlData)

        // 调用微信统一下单接口
        const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
          headers: { 'Content-Type': 'application/xml' }
        })

        console.log('微信返回:', response.data)

        // 解析返回的XML
        const result = await parseXML(response.data)
        const xmlResult = result.xml

        console.log('解析后的结果:', xmlResult)

        if (xmlResult.return_code !== 'SUCCESS' || xmlResult.result_code !== 'SUCCESS') {
          console.error('生成二维码失败:', xmlResult)
          return {
            success: false,
            message: xmlResult.return_msg || xmlResult.err_code_des || '生成二维码失败'
          }
        }

        // 返回二维码链接
        return {
          success: true,
          data: {
            codeUrl: xmlResult.code_url,
            orderId: orderId,
            totalPrice: totalPrice
          }
        }
      } catch (error) {
        console.error('生成二维码失败:', error)
        return {
          success: false,
          message: '生成二维码失败，请重试'
        }
      }

    // 更新订单状态
    case 'updateStatus':
      return await db.collection('orders').doc(data.id).update({
        data: {
          status: data.status
        }
      })

    // 更新支付状态
    case 'updatePayStatus':
      return await db.collection('orders').doc(data.id).update({
        data: {
          payStatus: data.payStatus
        }
      })

    // 获取支付二维码图片链接
    case 'getPayQRCodeUrl':
      try {
        const fileID = 'cloud://cloud1-d0giwawspff81411b.636c-cloud1-d0giwawspff81411b-1429623183/qrcode/pay.jpg'

        const result = await cloud.getTempFileURL({
          fileList: [fileID]
        })

        if (result.fileList && result.fileList.length > 0 && result.fileList[0].tempFileURL) {
          return {
            success: true,
            data: {
              url: result.fileList[0].tempFileURL
            }
          }
        } else {
          return {
            success: false,
            message: '获取图片链接失败'
          }
        }
      } catch (error) {
        console.error('获取图片链接失败:', error)
        return {
          success: false,
          message: error.message || '获取图片链接失败'
        }
      }

    // 删除订单
    case 'delete':
      // 先删除订单详情
      await db.collection('order_items').where({
        orderId: data.id
      }).remove()

      // 再删除订单
      return await db.collection('orders').doc(data.id).remove()

    default:
      return { success: false, message: '未知操作' }
  }
}
