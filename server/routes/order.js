const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 获取所有订单
router.get('/', orderController.getAllOrders);

// 获取单个订单
router.get('/:id', orderController.getOrderById);

// 创建订单
router.post('/', orderController.createOrder);

// 更新订单状态
router.put('/:id/status', orderController.updateOrderStatus);

// 删除订单
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
