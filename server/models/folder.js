var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var folderSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    shared_with: {
        type:[{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    }
});

module.exports = mongoose.model('Folder', folderSchema);