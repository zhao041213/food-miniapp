const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');

// 获取所有菜品
router.get('/', dishController.getAllDishes);

// 获取单个菜品
router.get('/:id', dishController.getDishById);

// 添加菜品
router.post('/', dishController.createDish);

// 更新菜品
router.put('/:id', dishController.updateDish);

// 删除菜品
router.delete('/:id', dishController.deleteDish);

module.exports = router;
