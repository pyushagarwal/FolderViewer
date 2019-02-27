var express = require('express');
var router = express.Router();
var User = require('../models/user');
var ERROR_MESSAGE = require('../errorMessage');
var Folder = require('../models/folder');
var fs = require("fs-extra");
var path = require("path");
var logger = require('../configurelog')();

router.get('/', function(req, res, next){
    User.find()
    .then((result) => res.status(200).send(result.map(function(row){
        return {
            name: row.name,
            email : row.email,
            id: row.id
        }
    })))
    .catch(next);
});

router.get('/:id', function(req, res, next){
    User.find({
        _id: req.params.id
    })
    .then((result) => res.status(200).send(result.map(function(row){
        return {
            name: row.name,
            email : row.email,
            id: row.id
        }
    })[0]))
    .catch(next);
});

router.delete('/:id', function(req, res, next){
    User.deleteOne({
        _id: req.params.id
    })
    .then(()=> res.status(200).json({
        deleted : true
    }))
    .catch(next);
});

router.post('/', function(req, res, next){
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
            logger.error(err);
            return res.status(400).json({status : 400, error: errMsg });
        }
        else{
            createNewFolderForUser(req, res, user, next)
        }
    });
});

function createNewFolderForUser(req, res, user, next){
    var directoryPath = req.app.get('DATA_DIRECTORY');
    var dirName = user.id;

    fs.mkdir(path.join(directoryPath, dirName))
    .then(function(){
        // Create a entry for a new folder in folder schema
        var folder = new Folder({
            name: user.id,
            is_root: true,
            created_by: user.id,
            modified_by: user.id,
            shared_with: [{
                user_id: user.id,
                action: 'GRANT'
            }]
        });
        return folder.save();
    })
    .then(function(folder){
        logger.debug(folder.id);
        logger.debug(folder.name);
        return User.update({_id: user.id},{
            $set : {
                files: [{
                    id: folder._id,
                    name: folder.name
                }]
            }
        })
    })
    .then(function(){
        res.status(201).json({
            name: user.name,
            email : user.email,
            id: user.id
        });
    })
    .catch(next);
}

/*Error handler*/
router.use(function(err, req, res, next){
    if(!res.headersSent){
        logger.error(err);
        res.status(500).send({
            error: {
                message: err.message,
                stacktrace: err.stacktrace
            }
        });
    }
});

module.exports = router;