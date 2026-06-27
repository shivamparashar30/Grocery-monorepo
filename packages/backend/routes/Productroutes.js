const express = require('express');
const router = express.Router();
const { getProductsByCategory, getProductByKey } = require('../controller/Productcontroller');

router.get('/',            getProductsByCategory); 
router.get('/:productKey', getProductByKey);      

module.exports = router;