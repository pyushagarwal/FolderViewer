var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var folderSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_on: {
        type: Date,
        default: Date.now,
        required: true
    },
    modified_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    modified_on: {
        type: Date,
        default: Date.now,
        required: true
    },
    is_root:{
        type: Boolean,
        default: true
    },
    shared_with: {
        type:[{
            user_id: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            action: {
                type: [String],
                enum: ['READ', 'WRITE', 'DELETE', 'GRANT'],
                default: ['READ']
            },
            _id : false
        }]
    },
    parent_id: {
        type: Schema.Types.ObjectId,
        ref: 'Folder'
    }
});

// folderSchema.methods.getObjectId = function(){
//     return Schema.Types.ObjectId.
// }

var Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;