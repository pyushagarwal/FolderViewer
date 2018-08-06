var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");
const errorMessage = require("../errorMessage");

// const PUBLIC_DIR = "D://";
const PUBLIC_DIR = "/media/piyush/33F777F756F64209/docs/documents/nodejs/FolderViewer/DataDirectory";

router.get('/*',function(req, res, next){
    var filePath = req.params[0];
    if(filePath === ''){
        return res.status(400).json({error:'file path required' });
    }

    var fullFilePath = path.join(PUBLIC_DIR, filePath);

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
})


router.put('/*',function(req, res, next){
  // console.log(req.body);
    var filePath = req.params[0];
    var oldFilePath = path.join(PUBLIC_DIR, filePath);
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
            res.status(200).json({
                "success" : true
            })
        }
    });
});

module.exports = router;