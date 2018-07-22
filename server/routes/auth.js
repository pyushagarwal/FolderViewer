var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var express = require('express');
var router = express.Router();


passport.use(new LocalStrategy({
        usernameField : 'email'
    },
    function(email, password, done){
        User.findOne({email : email}, function(err, user){
            if(err){
                return done(err);
            }

            if(!user){
                return(null, false, { message: 'Incorrect username.' });
            }

            done(null, user);
        });
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(id, done) {
    done(err, user);
});

router.post('/login', passport.authenticate('local'), function(user, res, next){
        console.log(Object.keys(user));
    } 
);

module.exports = router;