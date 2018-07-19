var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');


var UserSchema = new mongoose.Schema({
    username : {
        type : String,
        index : true
    },
    email: {
        type : String,
    },
    password: {
        type : String,
    },
    name: {
        type : String,
    }
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports = User;

User.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
        });
    });
}