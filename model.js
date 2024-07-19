var mongoose = require("mongoose");

var imageSchema = new  mongoose.Schema( {
    name:String,
    title : String,
    desc : String,
    img : {
        data:Buffer,
        contentType :String
    },
    address :String,

    contact :Number,
    
    work:String,
    userIdentifier: String
    
});

module.exports = mongoose.model('Image',imageSchema);