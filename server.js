const express = require('express');
const morgan = require('morgan');
const app = express();
const fs = require("fs");
const path = require("path");

//config 
const PORT = 4001;
// const PUBLIC_DIR = "D://";
const PUBLIC_DIR = "/media/piyush/33F777F756F64209/";

app.use(morgan('dev'));
app.use('/home', express.static('./'));

app.get('/api*',function(req, res, next){
    var filePath = req.params[0];
    console.log(`incoming_url=${filePath}`);

    var fullFilePath = path.join(PUBLIC_DIR, filePath);

    fs.readdir(fullFilePath, function(err, files){
      if(err){
        if(err.code === "ENOTDIR"){
          next();
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
            }
            
          });

          res.status(200).send(response);

      }
    });
})

app.listen(PORT, () => console.log("server started on port " + PORT));