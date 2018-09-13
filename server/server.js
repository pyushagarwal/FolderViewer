const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongo = require('mongo');
const mongoose = require('mongoose');
const PropertiesReader = require('properties-reader');
const path = require('path');
var fs = require('fs-extra');
var config = PropertiesReader('server.ini');

var logger = require('./configurelog')(config.get('LOG_LEVEL'));

mongoose.connection = (function(){
  var MONGOOSE_OPTIONS = {
      auto_reconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      useNewUrlParser: true,
      bufferCommands: false,
      poolSize: config.get('DB_CONNECTIONS_COUNT'),
  }

  if(config.get('DB_USER') && config.get('DB_PASSWORD')){
    logger.debug('DB username and password provided');
    MONGOOSE_OPTIONS.auth = {
      user: config.get('DB_USER'),
      password: config.get('DB_PASSWORD')
    }
  }
  
  const mongoConnectionUrl = `mongodb://${config.get('DB_HOST')}:${config.get('DB_PORT')}/${config.get('DB_NAME')}`;
  
  var connection = mongoose.createConnection(mongoConnectionUrl, MONGOOSE_OPTIONS); 

  connection.on('error', function(err) {
    logger.info("Mongodb event=error\n" + JSON.stringify(err));
  });
  
  connection.on('disconnected', function() {
    logger.info("Mongodb event=disconnected");
  });
  
  connection.on('connected', function(){
    logger.info(`Mongodb event=connected : connection established on host=${this.host} and port=${this.port}`);
  });
  return connection;  
})();


const app = express();

config.each(function(key, value){
  app.set(key, value);
})


var dataPath = app.get('DATA_DIRECTORY');
if(!dataPath){
  dataPath = path.dirname(__dirname);
}

dataPath = path.join(dataPath, 'FolderViewerData');

fs.mkdir(dataPath)
.then(function(){ 
  logger.info('Data path = ' + dataPath)
})
.catch(function(err){
  if(err && err.code === 'EEXIST') {
    logger.info('Data path = ' + dataPath);
  } else {
    logger.error(err);
    process.exit(0);
  }
});

app.set('DATA_DIRECTORY', dataPath);

  

app.set('logger', logger);

// app.use(morgan('dev'));

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

var shutdownMongooseConnection = function() {
  mongoose.connection.close().then(function(){
    logger.info('Mongo db connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdownMongooseConnection);
process.on('SIGINT', shutdownMongooseConnection);


if(!module.parent){
  app.listen(app.get('PORT'), () => logger.info("server started on port " + app.get('PORT')));
}

module.exports = app;
