var express = require('express');
var router = express.Router();
var User = require('../models/user');
var ERROR_MESSAGE = require('../errorMessage');
var Folder = require('../models/folder');
var fs = require("fs");
var path = require("path");

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
            var errMsg = '';
            if(err.code === ERROR_MESSAGE.MONGO_ERROR_CODE.DUPLICATE_KEY){
                errMsg = ERROR_MESSAGE.EMAIL_ID_ALREADY_EXISTS;
            }else{
                errMsg = ERROR_MESSAGE.BAD_REQUEST;
            }
            console.log(err);
            return res.status(400).json({status : 400, error: errMsg });
        }
        else{
            createNewFolderForUser(req, res, user)
        }
    });
});

function createNewFolderForUser(req, res, user){
    var directoryPath = req.app.get('DATA_DIRECTORY');
    var dirName = user.id;

    // make this async in the future
    fs.mkdirSync(path.join(directoryPath, dirName));
    
    // Create a entry for a new folder in folder schema
    var folder = new Folder({
        name: user.id,
        created_by: user.id,
        shared_with: [{
            id: user.id,
            action: 'ALL'
        }]
    });
    folder.save(function(err){
        if (err) {
            console.log(err);
            res.status(500).json({
                'error': err
            });
        } else {
            res.status(201).json({
                name: user.name,
                email : user.email,
            });
        }
    });
}

module.exports = router;