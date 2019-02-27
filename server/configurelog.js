const winston = require('winston');
const format = winston.format;
var logger = null;

module.exports = function(level){
    if(!level){
        level = 'info'
    }
    if(!logger){
        logger = winston.createLogger({
            format: format.combine(
              format.timestamp(),
              format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
            transports: [
              new winston.transports.Console({level: level}),
              new winston.transports.File({ filename: 'server.log', level: level})
            ]
        });
    }
    return logger;
};