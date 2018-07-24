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

app.use(morgan('dev'));
app.use(express.json());
/*
The below lines must be invoked serially
*/

app.use(cookieParser());
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
    res.status(401).send({"message " : "unauthorized"});
  }
}

app.use('/', express.static('./client'));

app.use('/api/auth', require('./routes/auth'));

app.use('/api/user', isAuthenticated, require('./routes/user'));
app.use('/api/file', require('./routes/folder'));


app.listen(PORT, () => console.log("server started on port " + PORT));