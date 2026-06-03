# 微信点餐小程序

基于 uni-app 和微信云开发的餐饮点餐小程序，包含用户点餐、购物车、订单、支付、评价、后台菜品管理、AI 菜品推荐和 AI 营养师功能。

## 功能概览

### 用户端

- 首页菜品展示，支持分类筛选和搜索。
- AI 菜品推荐，从已上架菜品中随机推荐，支持“换一批”。
- 推荐菜品展示名称、图片、描述和价格。
- 推荐页点击“加入购物车”后继续停留在推荐页，可多菜品一起结算。
- AI 营养师支持输入身高、体重、年龄，按 BMI 模拟推荐适合菜品并给出推荐理由。
- 购物车支持数量增减、删除菜品、提交订单。
- 订单页支持查看订单状态，并对待支付订单继续支付。
- 支持订单评价。

### 管理端

- 菜品新增、编辑、删除、上下架。
- 订单管理。
- 评价管理。

### 支付

- 使用微信支付统一下单。
- 支付密钥通过云函数环境变量或本地忽略文件配置。
- 支付回调云函数用于更新支付状态。

## AI 菜品推荐

底部导航栏新增 `AI推荐` 页面：

- 页面路径：`pages/recommend/recommend`
- 推荐逻辑：`utils/recommendation.js`
- 页面会调用菜品云函数获取已上架菜品，再随机展示 3 个推荐菜品。
- 点击“换一批”会重新随机推荐。
- 点击“加入购物车”只加入购物车，不会立即跳转支付。
- 用户可在购物车页统一点击结算，一次性提交和支付多个菜品。

相关测试：

```bash
node tests/recommendation.test.js
node tests/recommend-page.test.js
```

## AI 营养师

AI 营养师入口放在 `AI推荐` 页顶部，不占用底部导航栏。

- 页面路径：`pages/nutritionist/nutritionist`
- 推荐逻辑：`utils/nutritionist.js`
- 用户输入身高、体重和年龄后，系统计算 BMI 并生成模拟营养建议。
- BMI 偏低时优先推荐高蛋白、能量更足的菜品。
- BMI 正常时推荐均衡搭配。
- BMI 偏高时优先推荐清淡、控油、少主食的菜品。
- 推荐结果包含菜品价格和推荐理由。
- 点击“加入购物车”只加入购物车，用户可到购物车统一结算。

相关测试：

```bash
node tests/nutritionist.test.js
node tests/nutritionist-page.test.js
```

## 技术栈

- uni-app
- Vue.js
- 微信小程序
- 微信云开发
- 云函数：`dish`、`order`、`user`、`review`、`payCallback`

## 目录结构

```text
pages/
  index/               首页点餐
  recommend/           AI 菜品推荐
  nutritionist/        AI 营养师
  cart/                购物车与结算
  order/               订单列表和订单详情
  mine/                我的页面
  admin/               管理端页面
  review/              评价页面

utils/
  api.js               云函数 API 封装
  storage.js           本地缓存封装
  payment.js           支付调用封装
  recommendation.js    AI 推荐和加入购物车逻辑
  nutritionist.js      AI 营养师推荐规则

cloudfunctions/
  dish/                菜品云函数
  order/               订单和统一下单云函数
  payCallback/         微信支付回调云函数
  user/                用户云函数
  review/              评价云函数

tests/
  recommendation.test.js
  recommend-page.test.js
  nutritionist.test.js
  nutritionist-page.test.js
  payment.test.js
  payment-error.test.js
  pay-config.test.js
  pay-sign.test.js
  order-doc.test.js
```

## 运行方式

### 使用 HBuilderX

1. 用 HBuilderX 打开项目根目录。
2. 确认 `manifest.json` 和微信开发者工具 AppID 配置正确。
3. 选择“运行到小程序模拟器 -> 微信开发者工具”。
4. 在微信开发者工具中确认云开发环境和云函数已部署。

### 使用命令行

如果本机已安装 `uni` CLI，可以运行：

```bash
npm run build:mp-weixin
```

如果提示 `'uni' is not recognized`，说明本机未安装 uni-app CLI。可以继续使用 HBuilderX 运行。

## 微信支付配置

云函数 `order` 和 `payCallback` 需要配置微信支付参数：

- `WECHAT_PAY_APPID`
- `WECHAT_PAY_MCH_ID`
- `WECHAT_PAY_API_KEY`

建议在云函数控制台配置环境变量，不要把真实密钥提交到仓库。

## 测试

可单独运行当前已有测试：

```bash
node tests/recommendation.test.js
node tests/recommend-page.test.js
node tests/nutritionist.test.js
node tests/nutritionist-page.test.js
node tests/payment.test.js
node tests/payment-error.test.js
node tests/pay-config.test.js
node tests/pay-sign.test.js
node tests/order-doc.test.js
```

## 注意事项

- 当前 AI 推荐是基于已上架菜品的随机推荐，不依赖外部 AI 接口。
- 当前 AI 营养师是基于 BMI 和菜品名称、分类、描述的模拟规则推荐，不依赖外部 AI 接口，也不能替代医学或营养诊断。
- 购物车数据存储在本地缓存中，提交订单后会清空购物车。
- 支付功能需要商户号、AppID 绑定和 JSAPI 支付权限配置正确。
- `cloudfunctions/**/config.secret.js` 属于本地密钥文件，不应提交到 GitHub。

## License

MIT
