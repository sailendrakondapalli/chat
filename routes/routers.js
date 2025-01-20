const express=require('express')
const router= express.Router()
const empcntrl=require('../controllers/employeecontrolers')
const employees=require('../models/Employees')


//get,post,delete,post
router.post('/posting', empcntrl.cntrl )
module.exports = router