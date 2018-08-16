var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");
const errorMessage = require("../errorMessage");
var Folder = require('../models/folder');

/*Retrive contents of a folder*/
router.get('/*',function(req, res, next){
    var filePath = getFilePath(req);
    var next = function(){
        var fullFilePath = path.join(req.app.get('DATA_DIRECTORY'), filePath);

        fs.readdir(fullFilePath, function(err, files){
        if(err){
            if(err.code === "ENOTDIR"){
            res.status(400).send({
                error: errorMessage.NOT_A_DIRECTORY
            })
            }else{
            next(err);
            }
        }else{
            var response = [];

            files.forEach(function(file_name){
                var filePath = path.join(fullFilePath, file_name);
                try{
                var mtime = fs.statSync(path.join(fullFilePath, file_name)).mtime;
                response.push({
                    file_name : file_name,
                    mtime : mtime
                });
                }
                catch(error){
                    console.log(error);
                    next(null);
                }            
            });
            res.status(200).send(response);
        }
        });
    }
    userHasAccess(filePath, req.user, "READ", res, next);   
})

/* Rename a given folder path */
router.put('/*',function(req, res, next){
    var filePath = getFilePath(req);
    var userIdFromSession = req.user;

    var next = function(){
        if(filePath === userIdFromSession){
            return res.status(400).json({
                error : errorMessage.ROOT_DIR_CANNOT_BE_RENAMED     
            })
         }
         
         var dataDirectory = req.app.get('DATA_DIRECTORY');
         var oldFilePath = path.join(dataDirectory, filePath);
         var newFilePath = path.join( path.dirname(oldFilePath), req.body.file_name);
         fs.rename(oldFilePath, newFilePath, function(err){
             if(err){
                 if(err.code === "ENOENT"){
                     res.status(400).json({
                     error : errorMessage.FILE_DOES_NOT_EXISTS
                     })
                 }
                 else if(err.code === "ENOTEMPTY"){
                     res.status(400).json({
                     error : errorMessage.FILE_NAME_ALREAY_EXISTS
                     })
                 }
                 else{
                     next(err)
                 }
             }
             else{
                 res.status(204).json({
                     "success" : true
                 })
             }
         });     
    }
    
    userHasAccess(filePath, userIdFromSession, "RENAME", res, next);
});

/* Create a new directory in a given folder path */
router.post('/*', function(req, res){
    var filePath = getFilePath(req);
    var userIdFromSession = req.user;
    var next = function() {
        var folderName = req.body['folder-name'];
        var dataDirectory = req.app.get('DATA_DIRECTORY');
        var newFolderPath = path.join(filePath, folderName);
        var fullFilePath = path.join(dataDirectory, newFolderPath);

        fs.mkdir(fullFilePath, function(err){
            if(err){
                if(err.code === 'EEXIST'){
                    res.status(200).json({});
                } else {
                    res.status(400).json({
                        error : err
                    })
                }
            } else {
                var folder = new Folder({
                    name: newFolderPath.replace(/^\//,''),
                    created_by: userIdFromSession,
                    shared_with: [{
                        id: userIdFromSession,
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
                        res.status(201).json({});
                    }
                });
            }
        });
    };

    userHasAccess(filePath, userIdFromSession, "WRITE", res, next);
    
});

router.post('/*', function(req, res){
    var filePath = getFilePath(req);
    var userId = req.user;
    
    var next = function(){
        Folder.update({
            id: filePath
        },
    )
    }
    userHasAccess(filePath, userId, 'SHARE', res, next)
});

/* If no file path is provided, then the folder path is set to the userID of signed
in user.*/
var getFilePath = function(req){
    var filePath = req.params[0];
    if(filePath === ''){
        filePath = req.user;
    }
    return filePath;  
}


var userHasAccess = function(filePath, userId, action, res, next){
    
    // ACTIONS = {READ, WRITE, SHARE, ALL}

    var callback = function(folderId){
        if(folderId && folderId.length == 1){
            next();
        } else {
            res.status(403).send({
                error: errorMessage.FORBIDDEN_RESOURCE
            });
        }
    }
    if(action == "RENAME"){
        Folder.find({
            name: filePath,
            created_by: userId
        }, {
            id : 1
        }).then(callback);

    } else {
        Folder.find({
            name : filePath,
            'shared_with.id': userId,
            'shared_with.action': {
                $in : [action, 'ALL']
            }
        }, {
            id : 1
        })
        .then(callback);
    }
};

module.exports = router;