// 微信支付回调云函数
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const xml2js = require('xml2js')

cloud.init({
  env: 'cloud1-d0giwawspff81411b'
})

const db = cloud.database()

// 微信支付配置
const API_KEY = 'Kk755752725725752725752725725725'

// 生成签名
function generateSign(params) {
  const sortedKeys = Object.keys(params).sort()
  const stringA = sortedKeys
    .filter(key => params[key] !== '' && key !== 'sign')
    .map(key => `${key}=${params[key]}`)
    .join('&')

  const stringSignTemp = `${stringA}&key=${API_KEY}`
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase()
}

// XML转对象
async function parseXML(xml) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: true
  })
  return await parser.parseStringPromise(xml)
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

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到支付回调:', event)

  try {
    // 解析微信发送的XML数据
    const result = await parseXML(event.body)
    const data = result.xml

    console.log('解析后的数据:', data)

    // 验证签名
    const sign = data.sign
    const calculatedSign = generateSign(data)

    if (sign !== calculatedSign) {
      console.error('签名验证失败')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/xml' },
        body: buildXML({
          return_code: 'FAIL',
          return_msg: '签名验证失败'
        })
      }
    }

    // 检查支付结果
    if (data.return_code === 'SUCCESS' && data.result_code === 'SUCCESS') {
      const orderId = data.out_trade_no
      const transactionId = data.transaction_id

      console.log('支付成功，订单号:', orderId, '微信支付单号:', transactionId)

      // 更新订单状态
      try {
        await db.collection('orders').doc(orderId).update({
          data: {
            status: '制作中',
            transactionId: transactionId,
            payTime: db.serverDate()
          }
        })

        console.log('订单状态更新成功')

        // 返回成功响应给微信
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/xml' },
          body: buildXML({
            return_code: 'SUCCESS',
            return_msg: 'OK'
          })
        }
      } catch (error) {
        console.error('更新订单失败:', error)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/xml' },
          body: buildXML({
            return_code: 'FAIL',
            return_msg: '更新订单失败'
          })
        }
      }
    } else {
      console.error('支付失败:', data.return_msg || data.err_code_des)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/xml' },
        body: buildXML({
          return_code: 'SUCCESS',
          return_msg: 'OK'
        })
      }
    }
  } catch (error) {
    console.error('处理回调失败:', error)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml' },
      body: buildXML({
        return_code: 'FAIL',
        return_msg: '处理失败'
      })
    }
  }
}
