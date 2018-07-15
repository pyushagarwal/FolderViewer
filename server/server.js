const express = require('express');
const morgan = require('morgan');
const app = express();
const fs = require("fs");
const path = require("path");
const errorMessage = require("./errorMessage");

//config 
const PORT = 4001;
// const PUBLIC_DIR = "D://";
const PUBLIC_DIR = "/media/piyush/33F777F756F64209/docs/documents/nodejs/FolderViewer/DataDirectory";

app.use(morgan('dev'));
app.use(express.json());
app.use('/home', express.static('./'));

app.get('/api*',function(req, res, next){
    var filePath = req.params[0];

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
              next(error)
            }            
          });
          res.status(200).send(response);
      }
    });
})


app.put('/api*',function(req, res, next){
  // console.log(req.body);
  var filePath = req.params[0];
  var oldFilePath = path.join(PUBLIC_DIR, filePath);
  var newFilePath = oldFilePath.replace(/\/[^\/]*$/, "/" + req.body.file_name);

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

app.listen(PORT, () => console.log("server started on port " + PORT));