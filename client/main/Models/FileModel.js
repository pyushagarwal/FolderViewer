define(["backbone", 
        "Utils/common",
        "../Collection/UsersWithAcessCollection"
    ], function(Backbone,
        Common,
        UsersWithAcessCollection){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "/api/file",
        
        initialize : function(){
            this.on("backgrid:edited", this.renameFile);
            this.on("change:shared_with", this.modifySharedWithField);
        },
        
        defaults: {
            name: "",
            modified_by: {
                _id: "",
                name: ""
            },
            shared_with: [
                {
                    action: [
                        "GRANT"
                    ],
                    user_id: ""
                }
            ],
            modified_on: Date.now()
        },
        /*converts the shared_with field to a Backbone Collection
        */
        modifySharedWithField: function(model, value){
            var listOfSharedUsers = model.get('shared_with');
            if(!(listOfSharedUsers instanceof Backbone.Collection)) {
                model.set('shared_with', new UsersWithAcessCollection(listOfSharedUsers), {silent: true});
            }
        },

        /**Checks whether a filename represents a folder or a file
        * @param filename String indicating the name of the file
        * @returns A boolean value 
        */
        isAFile : function (filename) {
            var filename = this.get("name") || "";
            var fileExtension =  filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
            if(fileExtension){
                return true;
            }
            else{
                return false;   
            }
        },

        /**This function renames the file. It fires a PUT API request.
         *@param model Backbone model object
         *@param backGridRow object of type Backgrid Row
         */
        renameFile: function(newName, callback){
            this.set('name', newName);
            var oldFileName = this.previous('name');

            if (this.get('name') === oldFileName){ 
                return callback(null);
            }

            //Check whether a folder or file_name with same name already exists
            var isNameDuplicate = this.collection.reduce(_.bind(function( oldResult , iteratorModel ){
                if(iteratorModel != this && iteratorModel.get('name') === this.get('name') ){
                    return true;
                }
                return oldResult;
            }, this), false);
            
            if(isNameDuplicate){
                this.set('name', this.previous('name')); 
                return callback({ "error":" duplicate folder name" });
            }

            if(!this.previous('name')){
                var url = '/api/file';
                return this.createFile(url, callback);
            }

            var url = '/api/file/' + this.get('_id');

            Backbone.syncModified('PUT', url, {
                name: this.get('name')
            })
            .then(_.bind(function(response){
                this.set(response);
                callback(null);
            }, this))
            .catch(_.bind(function(error){
                this.set('name', this.previous('name'));
                console.log(error);
                callback(error);
            }, this));
        },

        createFile(url, callback) {
            Backbone.syncModified('POST', url, this)
            .then(_.bind(function(response){
                this.set(response);
                callback(null);
            }, this))
            .catch(function(error){
                console.log(error);
                callback(error);
            });
        },

        deleteFile(callback) {
            var url = this.url + '/' + this.get('_id');
            Backbone.syncModified('DELETE', url, this)
            .then(function(response){
                callback(null);
            })
            .catch(function(error){
                callback(error);
            })
        },

        provideAccess(userDetails, callback) {
            var url = this.url + '/' + this.get('_id');
            Backbone.syncModified('PUT', url, {
                shared_with: [{
                    email: userDetails[0].value,
                    action: [userDetails[1].value]
                }]
            })
            .then(function(response){
                callback(null, response);
            })
            .catch(function(error){
                callback(error);
            })
        },

        removeUserAccess(userDetails, callback) {
            var url = this.url + '/' + this.get('_id');
            Backbone.syncModified('PUT', url, {
                removeUserAccess: true,
                shared_with: [{
                    email: userDetails.get('email'),
                    action: userDetails.get('action')
                }]
            })
            .then(function(response){
                callback(null, response);
            })
            .catch(function(error){
                callback(error);
            })
        }
    })
});