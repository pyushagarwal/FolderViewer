var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var express = require('express');
var router = express.Router();
var logger = require('../configurelog')();

passport.use(new LocalStrategy({
        usernameField : 'email'
    },
    function(email, password, done){
        logger.debug("inside local strategy callback");
        User.findOne({email : email}, function(err, user){
            if(err){
                return done(err);
            }

            if(!user){
                return done(null, false, { error: 'The account does not exists'});
            }

            //console.log(`user found in database ${user.email}`);
            user.verifyPassword(password, done);
        });
}));

passport.serializeUser(function(user, done) {
    //console.log('Inside serializeUser callback. User id is save to the session file store here')
    done(null, user.id);
});

passport.deserializeUser(function(userId, done) {
    //console.log(`Inside deserializeUser callback. Userid= ${userId}`)    
    done(null, userId);
});

router.post('/login', function(req, res, next){
    //console.log("inside POST login route callback");
    //console.log(req.body);
    //console.log(req.sessionID);

    passport.authenticate('local', function(err, user, info){
        //console.log("inside passport authenticate callback");
        
        if(err){
            return res.status(500).json(err);
        }
        //console.log(arguments);
        if(!user){
            return res.status(401).json(info);
        }
        //console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        //console.log(`req.user: ${JSON.stringify(req.user)}`)
        
        req.login(user, function(err){
            //console.log('Inside req.login() callback')
            //console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
            //console.log(`req.user: ${JSON.stringify(req.user)}`);
            return res.status(200).send({
                status : 200,
                message : 'loggedin'
            });
        });

    })(req, res, next);
});

//console.log('auth initialized');



module.exports = router;