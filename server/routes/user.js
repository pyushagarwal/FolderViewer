var express = require('express');
var router = express.Router();
var User = require('../models/user');

router.get('/user', function(req, res){
    res.status(200).json({"name" :"piyush"});
});

router.post('/user', function(req, res){
    var user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    });
});

module.exports = router;