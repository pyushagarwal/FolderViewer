var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');


var userSchema = new mongoose.Schema({
    email: {
        type: String,
        index: true,
        unique: true
    },
    password: {
        type : String,
    },
    name: {
        type : String,
    }
});

userSchema.pre('save', function(callback){
    var user = this;
    bcrypt.genSalt(5, function(err, salt) {
        bcrypt.hash(user.password, salt, function(err, hash) {
            user.password = hash;
            callback(null);
        });
    });
});


module.exports = mongoose.model('User', userSchema);


