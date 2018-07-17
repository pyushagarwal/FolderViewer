var express = require('express');
var router = express.Router();

router.get('/user', function(){
    res.status(200).json({"name" :"piyush"});
});

