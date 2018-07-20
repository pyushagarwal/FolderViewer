var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');

passport.use(new BasicStrategy(function(username, password, callback){
    User.findOne({username : username}, function(err, user){
        if(err){
            return callback(err);
        }
        user.verifyPassword(password, function(err, isMatch){
            if(err){
                return callback(err);
            }
            else if(isMatch)
                return callback(null,user)
            else
                return callback(null,false);
        })
    });
    
}));


module.exports.isAuthenticated = passport.authenticate('basic', {session : false });