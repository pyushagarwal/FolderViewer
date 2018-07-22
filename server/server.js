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
app.use('/home', express.static('./client'));

app.use(cookieParser());

app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/user', require('./routes/user'));
app.use('/api/file', require('./routes/folder'));
app.use('/auth', require('./routes/auth'));

app.listen(PORT, () => console.log("server started on port " + PORT));