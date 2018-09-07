var express = require('express');
var router = express.Router();
const fs = require('fs-extra')
var path = require("path");
const errorMessage = require("../errorMessage");
var Folder = require('../models/folder');
var User = require('../models/user');

/*Retrieve contents of a folder*/
router.get('/:id?',function(req, res){
    // var filePath = getFilePath(req);

    var userId = req.user;
    var fileId = req.params.id;

    var promise = getFileIdOfRootUser(fileId, userId);

    promise.then(function(fileId){
        return userHasAccess(fileId, req.user, "READ", res);
    })
    .then(function(fileInfo){
        if(!fileInfo){
            return;
        }
        console.log(fileInfo);
        var fullFilePath = path.join(req.app.get('DATA_DIRECTORY'), fileInfo.name);
        fs.readdir(fullFilePath, fileInfo)
        .then(function(files){  
            files = files.map(function(fileName){
                return path.join(fileInfo.name, fileName);
            })
            return Folder.find({
                name: {
                    "$in": files
                }}, {
                    _id: true,
                    name: true
                })
            .exec();
        })
        .then(response => res.status(200).json({
           id: fileInfo.id,
           name: fileInfo.name,
           files: response
        }))
        .catch(function(err){
            if(err && err.code === "ENOTDIR"){
                res.status(400).send({
                    error: errorMessage.NOT_A_DIRECTORY
                })
            } else {
                res.status(500).send({
                    error: err
                });
            }
        });
    })
    .catch(function(err){
        res.status(500).json({
            error: {
                message: err.message,
                stack: err.stack
            }
        });
    });
})

/* Rename a given folder path */
router.put('/:id', function(req, res, next){
    if(req.body.name){
        renameFile(req, res);
    } else if(req.body.shared_with &&  req.body.shared_with.length > 0){
        grantPermissions(req, res);
    } 
    else {
        res.status(400).send({});
    }
});

function grantPermissions(req, res){
    var fileId = req.params.id;
    var userId = req.user;
    userHasAccess(fileId, req.user, "GRANT", res)
    .then(function(fileInfo){
        if(!fileInfo){
            return;
        }

        var IdOfUsers = req.body.shared_with.map(user => {
            return user.user_id
        });
        
        /*The permissions of the user who created it should never be modified
        So remove the user id of the created user from the shared_with array
        */

        IdOfUsers[IdOfUsers.indexOf(fileInfo.created_by.toString())] = null;

        return Folder.update({
            _id: fileId
        },{
            $pull: {
                'shared_with' :{
                    'user_id':{
                        '$in' : IdOfUsers
                        }
                }
            }
        }).exec();
    })
    .then(function(){
        var usersToBeGrantedAccess = req.body.shared_with;
        return Folder.update({
            _id: fileId
        },{
            $addToSet :{
                'shared_with':{
                    $each: usersToBeGrantedAccess
                }
            }
        }).exec();
    })
    .then( () => res.status(204).json({}))
    .catch(function(err){
        res.status(500).send({
            error: err
        });
    });
}

function renameFile(req, res) {
    var fileId = req.params.id;
    var userId = req.user;
    var promise =  userHasAccess(fileId, req.user, "WRITE", res);
    promise.then(function(fileInfo){
        if(!fileInfo){
            return;
        }
        if ( fileInfo.name === userId ) {
            return res.status(400).json({
                error : errorMessage.ROOT_DIR_CANNOT_BE_RENAMED     
            })
        }
        
        var dataDirectory = req.app.get('DATA_DIRECTORY');
        var newFileName = path.join(path.dirname(fileInfo.name), req.body.name);

        var oldFilePath = path.join(dataDirectory, fileInfo.name);
        var newFilePath = path.join( dataDirectory, newFileName);

        fs.rename(oldFilePath, newFilePath)
        .then(function(){
            return Folder.update({
                _id: fileInfo._id
            }, {
                name: newFileName
            })
        })
        .then( () => res.status(200).json({"success" : true}))
        .catch( function(err){
            if(err.code === "ENOENT"){
                res.status(400).json({
                error : errorMessage.FILE_DOES_NOT_EXISTS
                })
            }
            else if(err.code === "ENOTEMPTY" || 'EPERM'){
                res.status(400).json({
                error : errorMessage.FILE_NAME_ALREAY_EXISTS
                })
            }
            else{
                res.status(500).send({
                    error: err
                });
            }
        });
    });
}
/* Create a new directory
@params : req.body : {
    "parent_id" : '',
    "name": '',
    "shared_with" : []
}*/
router.post('/', function(req, res, next){
    
    var parentFileId = req.body['parent_id'];
    var userId = req.user;

    var promise = getFileIdOfRootUser(parentFileId, userId);

    promise.then(function(parentFileId){
        return userHasAccess(parentFileId, userId, "WRITE", res, {shared_with : 1});
    })
    .then( function(parentFileInfo) {

        var fileName = req.body['name'];
        var dataDirectory = req.app.get('DATA_DIRECTORY');
        var newFilePath = path.join(parentFileInfo.name, fileName);
        var fullFilePath = path.join(dataDirectory, newFilePath);
        fs.mkdir(fullFilePath)
        .then(function(){

            var shared_with = parentFileInfo.shared_with;
            
            shared_with = shared_with.filter(function(current){
                if(current.user_id.toString() === userId ){
                    return false;
                }
            });

            shared_with.push({
                user_id: userId,
                action: 'GRANT'
            });

            var folder = new Folder({
                name: newFilePath.replace(/^\//,''),
                created_by: userId,
                modified_by: userId,
                shared_with: shared_with,
                is_root: false
            });

            return folder.save().then((newFileInfo) => res.status(201).json({
                name: newFileInfo.name,
                id: newFileInfo._id
            }));
        })
        .catch(function(err){
            if(err && err.code === 'EEXIST'){
                res.status(400).json({error : errorMessage.FILE_NAME_ALREAY_EXISTS});
            } else {
                res.status(500).json({
                    'error': err
                });
            }
        });
    })
    .catch(function(err){
        
    });
});

router.delete('/:id', function(req, res, next){
    var userId = req.user;
    var fileId = req.params.id
    var promise = userHasAccess(fileId, userId, "DELETE", res);
    promise.then(function(fileInfo){
        if(!fileInfo){
            return;
        }
        if(fileInfo.is_root) {
            res.status(400).json({
                error: 'Root directory cannot be deleted'
            });
            return;
        }
        var dataDirectory = req.app.get('DATA_DIRECTORY');
        var filePath = path.join(dataDirectory, fileInfo.name);
        return fs.remove(filePath)    
        .then(function(){
            return Folder.deleteOne({
                _id: fileInfo._id
            });
        })
        .then(() => res.status(204).json())
        .catch(function(err) {
            throw err;
        });
    })
    .catch(next);
});

router.use(function(req, res){
    res.status(404).send();
});

router.use(function(err, req, res){
    res.status(500).send({
        error: {
            message: error.message,
            stacktrace: error.stacktrace
        }
    });
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


/*This function returns a promise
 */
var userHasAccess = function(fileId, userId, action, res, fieldsToBeReturned){
    
    // ACTIONS available = {READ, WRITE, DELETE, GRANT, ALL}
    
    const ACTIONS = {
        "READ" : ["READ", "WRITE", "DELETE", "GRANT"],
        "WRITE": ["WRITE", "DELETE", "GRANT"],
        "DELETE": ["DELETE", "GRANT"],
        "GRANT": ["GRANT"]
    }

    fieldsToBeReturned = Object.assign({
        _id : 1,
        name: 1,
        created_by: 1,
        is_root: 1
    }, fieldsToBeReturned);

    return Folder.findOne({
        _id: fileId,
        'shared_with': {
            $elemMatch : {
                'user_id': userId,
                'action' : {
                    "$in" : ACTIONS[action]
                }
            }
        }
    }, fieldsToBeReturned).exec()
    .then(function(fileInfo){
        if(fileInfo){
            return fileInfo;
        } else {
            res.status(403).send({
                error: errorMessage.FORBIDDEN_RESOURCE
            });
            return null;
        }
    });
}

/*Returns a promise with a "file id of root" user as a param
*/
var getFileIdOfRootUser = function(fileId, userId){
    return new Promise(function(resolve, reject){
        if(!fileId){
            User.findOne({
                _id: userId
            },{
                files: true
            })
            .then(function(user){
                fileId = user.files[0].id;
                resolve(fileId);
            })
            .catch(function(err){
                reject(err)
            });
        } else {
            resolve(fileId);
        }
    });
}

module.exports = router;