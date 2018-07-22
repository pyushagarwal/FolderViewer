var express = require('express');
var router = express.Router();
var User = require('../models/user');

router.get('/', function(req, res){
    User.find()
    .then((result) => res.status(200).send(result.map(function(row){
        return {
            name: row.name,
            email : row.email,
        }
    })))
});

router.post('/', function(req, res){
    var user = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    });
    
    user.save(function(err){
        if(err){
            console.log(arguments);
            return res.status(400).json({status : 400, error: err});
        }
        else{
            return res.status(200).json({
                name: user.name,
                email : user.email,
            });
        }
    });
});

module.exports = router;