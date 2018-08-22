var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');


var userSchema = new mongoose.Schema({
    email: {
        type: String,
        index: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
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

userSchema.methods.verifyPassword = function(incomingPassword, done){
    console.log('Inside verifyPassword in user model');

    var user = this;
    
    bcrypt.compare(incomingPassword, this.password, function(err, isPasswordCorrect) {
        if(err){
            return done(err);
        }
        if(isPasswordCorrect){
            done(null, user);
        }
        else{
            done(null, false, { error: 'The password entered is incorrect'});
        }

    });
}

module.exports = mongoose.model('User', userSchema);


