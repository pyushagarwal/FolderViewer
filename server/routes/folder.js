var express = require('express');
var router = express.Router();
const fs = require('fs-extra')
var path = require("path");
const errorMessage = require("../errorMessage");
var Folder = require('../models/folder');
var User = require('../models/user');
var winston = require('winston');
var logger = require('../configurelog')();
var formidable = require('formidable');
var util = require('util');

router.post('/:id/upload', function(req, res, next){
    var userId = req.user;
    var parentFileId = req.params.id;
    var promise = getFileIdOfRootUser(parentFileId, userId);
    var fileNameFromHeader = req.headers.filename;
    var dataDirectory = req.app.get('DATA_DIRECTORY');
    var folderModel;
    promise.then(function(parentFileId){
        return userHasAccess(parentFileId, userId, "WRITE", res, {shared_with : 1});
    })
    .then(function(parentFileInfo){ 
        req.shared_with = parentFileInfo.shared_with;
        var fileNameWithPath = path.join(parentFileInfo.name, fileNameFromHeader);

        folderModel = new Folder({
            name: fileNameWithPath,
            created_by: userId,
            modified_by: userId,
            shared_with: req.shared_with,
            is_root: false,
            parent_id: parentFileId,
            is_dir: false
        });
        return folderModel.save();;
    })
    .then(function() {
        var form = new formidable.IncomingForm();
        form.uploadDir = path.join(dataDirectory, path.dirname(folderModel.name));
        return new Promise(function(resolve, reject){
            form.on('fileBegin', function(name, file){
                file.path = path.join(form.uploadDir, fileNameFromHeader);
            });
            form.parse(req, function(err, fields, files){
                if(err) {
                    reject(err);
                } else {
                    // req.fileName = files.fileName.name;
                    // resolve(path.relative(dataDirectory, files.fileName.path));
                    resolve(null);
                }
            });
        });
    })
    .then(function(){
        return folderModel.populate({ 
            path: 'modified_by',
            select: 'name' 
        }).populate({ 
            path: 'created_by',
            select: 'name' 
        }).populate({
            path: 'shared_with.user_id',
            select:['name', 'email']
        }).execPopulate();
    })
    .then(function(response){
        res.status(201).json(folderDetailsToBeReturned(response));
    })
    .catch(function(error){
        if(error && error.code == 11000){
            res.status(400).json({error : errorMessage.FILE_NAME_ALREAY_EXISTS});
        }
        else if(error instanceof Error && error.message.indexOf('Request aborted') != -1) {
            logger.info('File uploading terminated by client');
            folderModel.remove();
            res.status(400).json({
                error: errorMessage.FILE_UPLOAD_STOPPED_BY_CLIENT
            });
        }
        else {
            next(error);
        }
    });
});

router.get('/shared', function(req, res, next) {
    var userId = req.user;
    User.findOne({
        _id: userId
    },{
        files: 1
    }).lean().exec()
    .then(function(userDetails){
        var fileIds = userDetails.files.map(function(eachFile) {
            return eachFile.id;
        });
        return Folder.find({
            _id: {
                $in : fileIds
            }
        })
        .populate({path: 'modified_by', select: 'name' })
        .populate({path: 'shared_with.user_id', select:['name', 'email']}).lean().exec();
    })
    .then(function(response) {
        res.status(200).json({
            files: response.map(folderDetailsToBeReturned)  
        });
    })
    .catch(next);
});

/*Serve a static file and Retrieve contents of a folder*/
router.get('/:id?',function(req, res, next){
    var userId = req.user;
    var fileId = req.params.id;

    var promise = getFileIdOfRootUser(fileId, userId);

    promise.then(function(fileId){
        var fieldsToBeReturned = {
            shared_with: { 
                    $elemMatch: { 
                        user_id: req.user
                    }
            },
            parent_id: 1,
            is_root: 1,
            is_dir: 1
        }
        return userHasAccess(fileId, req.user, "READ", res, fieldsToBeReturned);
    })
    .then(function(fileInfo){
        var fullFilePath = path.join(req.app.get('DATA_DIRECTORY'), fileInfo.name);
        if(!fileInfo.is_dir){
            return res.download(fullFilePath);
        }
        /* withFileTypes option is supported in node 10*/
        fs.readdir(fullFilePath, {withFileTypes: true})
        .then(function(files){  
            files = files.map(function(fileName){
                return path.join(fileInfo.name, fileName);
            })
            return Folder.find({
                name: {
                    "$in": files
                }})
            .populate({ path: 'modified_by', select: 'name' })
            .populate({path: 'shared_with.user_id', select:['name', 'email']}).lean().exec();
        })
        .then(function(response) {
            res.status(200).json({
                id: fileInfo.id,
                name: path.basename(fileInfo.name),
                permission: fileInfo.shared_with[0].action,
                parent_id: fileInfo.parent_id,
                is_root: fileInfo.is_root,
                files: response.map(folderDetailsToBeReturned)
            });
        })
        .catch(function(err){
            if(err && err.code === "ENOTDIR"){
                res.status(400).send({
                    error: errorMessage.NOT_A_DIRECTORY
                })
            } else {
                next(err);
            }
        });
    })
    .catch(next);
})



/* Rename a given folder path */
router.put('/:id', function(req, res, next){
    if(req.body && req.body.name){
        renameFile(req, res, next);
    } else if(req.body && req.body.shared_with &&  req.body.shared_with.length > 0){
        grantPermissions(req, res, next);
    } 
    else {
        res.status(400).send({});
    }
});

function grantPermissions(req, res, next){
    var fileId = req.params.id;
    var userId = req.user;
    var descendants = [];
    var fileDetails;
    userHasAccess(fileId, req.user, "GRANT", res, {parent_id: 1})
    .then(function(fileInfo){
        fileDetails = fileInfo;
        if(fileDetails.is_root){
            throw Error(errorMessage.ROOT_PERMISSION_MODIFY_ERROR);
        }
        return getAllDescendants(path.join(req.app.get('DATA_DIRECTORY'), fileInfo.name));
    })
    .then(function(allDescendants){
        descendants = allDescendants.map(function(filePath){
            return path.relative(req.app.get('DATA_DIRECTORY'), filePath);
        });

        descendants.push(fileDetails.name);
        logger.info(descendants);

        var emailOfUsers = req.body.shared_with.map(user => {
            return user.email;
        });

        return User.find({
            email: {
                "$in": emailOfUsers
            }}, {
                _id: true,
                email: true
        });
    })
    .then(function(usersToBeGrantedAccess){

        if(usersToBeGrantedAccess.length === 0 ){
            throw errorMessage.USER_WITH_EMAIL_ID_DOES_NOT_EXISTS
        }
        var emailToIdMapping = {};
        usersToBeGrantedAccess.forEach((each)=>{
            emailToIdMapping[each.email] = each.id;
        });
        
        req.body.shared_with = req.body.shared_with.map((eachUser)=>{
            var tmp = {};
            tmp.user_id = emailToIdMapping[eachUser.email];
            tmp.action = eachUser.action;
            return tmp;
        });
        return Folder.update({
            "name" :{
                $in: descendants
                }
        },{
            $pull: {
                'shared_with' :{
                    'user_id':{
                        '$in' : usersToBeGrantedAccess.map((each) => {
                                return each._id
                            })
                        }
                }
            }
        },{
            multi: true
        }).exec();
    })
    .then(function(){
        return Folder.find({
            name: {
                $in: descendants
            }
        },{
            _id: 1
        })
    })
    .then(function(descendantFolderDetails){
        console.log("171", JSON.stringify(descendantFolderDetails));
        console.log("172 userid ", req.body.shared_with[0].user_id );
        return User.update({
            _id: req.body.shared_with[0].user_id
        },{
            $pull: {
                files: {
                    id:{
                        $in: descendantFolderDetails.map((each) => { return each._id}) 
                    }
                }
            }
        })
    })
    .then(function(){
        if(req.body.removeUserAccess) {
            throw errorMessage.USER_ACCESS_REVOKED;
        }
        var usersToBeGrantedAccess = req.body.shared_with;
        return Folder.update({
            "name" :{
                $in: descendants
                }
        },{
            $addToSet :{
                'shared_with':{
                    $each: usersToBeGrantedAccess
                }
            }
        },{
            "multi": true 
        });
    })
    .then(function(){
        console.log("203 userid ", req.body.shared_with[0].user_id, " fileid", fileDetails._id);
        return User.update({
            $and:[{
                _id: req.body.shared_with[0].user_id
            },{
                "files.id": { $ne: fileDetails.parent_id }
            }]
        },{
            $addToSet :{
                files: { 
                    id: fileDetails._id
                }
            }
        });
    })
    .then(function(){
        return Folder.findOne({
            $and : [
                {_id: fileId},
                {"shared_with.user_id" : req.body.shared_with[0].user_id}
            ]},
            {
              "shared_with.$" : 1
            }
        )
        .populate({path: 'shared_with.user_id', select:['name', 'email']}).lean().exec();
    })
    .then( function(response) {
        response.shared_with = response.shared_with.map(function(eachUser){
            return {
                email: eachUser.user_id.email,
                action: eachUser.action,
                name: eachUser.user_id.name
            };
        })
        return res.status(201).json(response);
    })
    .catch(function(error){
        if( error === errorMessage.USER_WITH_EMAIL_ID_DOES_NOT_EXISTS) {
            return res.status(400).json({
                error: errorMessage.USER_WITH_EMAIL_ID_DOES_NOT_EXISTS
            });
        } else if(error === errorMessage.USER_ACCESS_REVOKED) {
            return res.status(201).json({});
        } else if(error instanceof Error && error.message === errorMessage.ROOT_PERMISSION_MODIFY_ERROR) {
            return res.status(400).json({
                error: errorMessage.ROOT_PERMISSION_MODIFY_ERROR
            });
        } else {
            next(error);
        }
    });
}

function renameFile(req, res, next) {
    var fileId = req.params.id;
    var userId = req.user;
    var promise =  userHasAccess(fileId, req.user, "WRITE", res);
    promise.then(function(fileInfo){
        if ( fileInfo.name === userId ) {
            return res.status(400).json({
                error : errorMessage.ROOT_DIR_CANNOT_BE_RENAMED     
            })
        }
        
        var dataDirectory = req.app.get('DATA_DIRECTORY');
        var newFileName = path.join(path.dirname(fileInfo.name), req.body.name);

        var oldFilePath = path.join(dataDirectory, fileInfo.name);
        var newFilePath = path.join( dataDirectory, newFileName);

        fs.move(oldFilePath, newFilePath)
        .then(function(){
            return Folder.update({
                _id: fileInfo._id,
            }, {
                name: newFileName,
                modified_by: userId,
                modified_on: Date.now()
            })
        })
        .then(function(){
            return Folder.findOne({
                _id: fileInfo._id,
            })
            .populate({path: 'modified_by', select: 'name' })
            .populate({path: 'shared_with.user_id', select:['name', 'email']}).lean().exec();
        })
        .then( (response) => res.status(200).json(folderDetailsToBeReturned(response)))
        .catch( function(err){
            if(err.message.indexOf("dest already exists") != -1){
                res.status(400).json({
                    error : errorMessage.FILE_NAME_ALREAY_EXISTS
                })
            }
            else{
                next(err);
            }
        });
    })
    .catch(next);
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

            var folder = new Folder({
                name: newFilePath.replace(/^\//,''),
                created_by: userId,
                modified_by: userId,
                shared_with: shared_with,
                is_root: false,
                parent_id: parentFileInfo.id
            });

            return folder.save();
        })
        .then(function(newFileInfo){
            return newFileInfo.populate({ 
                path: 'modified_by',
                select: 'name' 
            }).populate({ 
                path: 'created_by',
                select: 'name' 
            }).populate({
                path: 'shared_with.user_id',
                select:['name', 'email']
            }).execPopulate();
        })
        .then(function(fileInfo){
            res.status(201).json(folderDetailsToBeReturned(fileInfo));
        })
        .catch(function(err){
            if(err && err.code === 'EEXIST'){
                res.status(400).json({error : errorMessage.FILE_NAME_ALREAY_EXISTS});
            } else {
                next(err);
            }
        });
    })
    .catch(next);
});

router.delete('/:id', function(req, res, next){
    var userId = req.user;
    var fileId = req.params.id
    var promise = userHasAccess(fileId, userId, "DELETE", res);
    promise.then(function(fileInfo){
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
            next(err);
        });
    })
    .catch(next);
});

router.use(function(req, res){
    res.status(404).send();
});

/*Error handler*/
router.use(function(err, req, res, next){
    if(!res.headersSent){
        if(err.message ===  errorMessage.FORBIDDEN_RESOURCE){
            res.status(403).send({
                error: errorMessage.FORBIDDEN_RESOURCE
            })
        } else {
            logger.error(err.message + " " + err.stack);
            res.status(500).json({
                error: {
                    message: err.message,
                    stacktrace: err.stack
                }
            });
        }
    }
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
            throw new Error(errorMessage.FORBIDDEN_RESOURCE)
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

/*
**/
var getFileName = function(parentPath, childPath){
   var fileName = childPath.replace(parentPath,'');
   fileName = fileName.replace('/','');
   fileName = fileName.replace('\\',''); 
   return fileName;
}

/*
Returns a promise to recursively fetch all children of a directory
*/
var getAllDescendants = function(rootFilePath){
    return new Promise(function(resolve, reject) {
        if(rootFilePath.indexOf('.') != -1){
            resolve([]);
            return;
        } 
        var subFolders = [];
        var fsFunctionInvoked = 0;
        var getAllSubFolders = function(parentFilePath){
            fsFunctionInvoked += 1;
            fs.readdir(parentFilePath)
            .then(function(children){
                fsFunctionInvoked -= 1;
                children.forEach(function(childFileName){
                    subFolders.push(path.join(parentFilePath, childFileName));
                    // Check whether it is a directory
                    if(childFileName.indexOf('.') == -1) {
                        getAllSubFolders(path.join(parentFilePath, childFileName));
                    }
                });
    
                if(fsFunctionInvoked === 0){
                    resolve(subFolders);
                }
            })
            .catch(function(error){
                reject(error);
            });  
        };
        getAllSubFolders(rootFilePath);
    });
}


var folderDetailsToBeReturned = function(newFileInfo) {
    return {
        name: path.basename(newFileInfo.name),
        _id: newFileInfo._id,
        created_by: newFileInfo.created_by,
        modified_by: newFileInfo.modified_by,
        modified_on: newFileInfo.modified_on,
        shared_with: newFileInfo.shared_with.map(function(sharedUserList){
            return {
                action: sharedUserList.action,
                name: sharedUserList.user_id.name,
                email: sharedUserList.user_id.email,
                user_id: sharedUserList.user_id._id
            }
        }),
        is_root: newFileInfo.is_root,
        parent_id: newFileInfo.parent_id,
        is_dir: newFileInfo.is_dir
    };
};

module.exports = router;