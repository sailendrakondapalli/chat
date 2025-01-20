const Employees = require('../models/Employees')
const cntrl=async(req,res)=>{
    try{
        const { name,email } = req.body
        const emp=new Employees({ 
            name,
            email
         })
         await emp.save()
         res.status(201).json(Employees)
    }
    catch(error){
        console.log(error)
        res.status(501).json({message:"Error"})
    }
}
module.exports={ cntrl }