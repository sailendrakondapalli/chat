const mongoose=require('mongoose')
const myschema=mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
    type:String,
    require:true
    }
})
module.exports=mongoose.model('Employee',myschema)