var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var folderSchema = new Schema({
    _id: {
        type: String
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    shared_with: {
        type:[{
            id: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            action: {
                type: [String],
                enum: ['ALL', 'READ', 'WRITE', 'SHARE'],
                default: ['READ']
            }
        }]
    }
}, {_id: false});

// folderSchema.methods.getObjectId = function(){
//     return Schema.Types.ObjectId.
// }

var Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;