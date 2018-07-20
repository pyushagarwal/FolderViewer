var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');


var userSchema = new mongoose.Schema({
    email: {
        type : String,
        unique: true,
        required: true,
        index: true
    },
    password: {
        type : String,
        required: true
    },
    name: {
        type : String,
        required: true
    }
});

userSchema.pre('save', function(callback){
    var user = this;
    bcrypt.genSalt(5, function(err, salt) {
        if(err){
            return callback(err);
        }
        
        bcrypt.hash(user.password, salt, function(err, hashedPwd) {
            if(err){
                return callback(err);
            }
            user.password = hashedPwd;
            callback(null, user); 
        });
    });
});

var User = module.exports = mongoose.model('User', userSchema);

module.exports = User;