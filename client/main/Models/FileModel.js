define(["backbone", 
        "Utils/common"], function(Backbone, Common){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "/api/file",
        
        initialize : function(){
            this.on("backgrid:edited", this.renameFile);
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

            $.ajax({
                url : url,
                type: 'PUT',
                data: JSON.stringify({
                    name: this.get('name')
                }),
                contentType: 'application/json',
                dataType: 'json'
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
            this.sync('create', this)
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
            var oldUrl = this.url;
            this.url += '/' + this.get('_id');
            this.sync('delete', this)
            .then(function(response){
                this.url = oldUrl;
                callback(null);
            })
            .catch(function(error){
                this.url = oldUrl;
                callback(error);
            })
        }
    })
});