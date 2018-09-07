const express = require('express');
const morgan = require('morgan');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongo = require('mongo');
const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/folderViewer", { useNewUrlParser: true },
    function(err, res){
      if(err)
        console.log("Error occurred while connecting to mongodb " + JSON.stringify(err));
      else
        console.log(`mongodb connected on host=${res.host} and port=${res.port}`);
});

const PORT = 4001;
const app = express();

// const PUBLIC_DIR = "D://javascript30//FolderViewer//DataDirectory";
const PUBLIC_DIR = "/media/piyush/33F777F756F64209/docs/documents/nodejs/FolderViewer/DataDirectory";

app.set('DATA_DIRECTORY', PUBLIC_DIR);

app.use(morgan('dev'));
app.use(express.json());
/*
The below lines must be invoked serially
*/

// app.use(cookieParser());
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());


var isAuthenticated = function(req, res, next){
  if(req.isAuthenticated && req.isAuthenticated()){
    next(null);
  }else{
    res.status(401).send({});
  }
}

app.use('/', express.static('./client'));

app.use('/api/auth', require('./routes/auth'));

app.use('/api/user', require('./routes/user'));
app.use('/api/file', isAuthenticated ,require('./routes/folder'));


app.get('/api/session', function(req, res){
  res.status(200).send(Object.keys(app));
});

if(!module.parent){
  app.listen(PORT, () => console.log("server started on port " + PORT));
}

module.exports = app;