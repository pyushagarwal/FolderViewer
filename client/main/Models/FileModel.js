define(["backbone", 
        "Utils/common"], function(Backbone, Common){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "/api/file",
        
        initialize : function(){
            this.on("backgrid:edited", this.renameFile);
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
        renameFile: function(model, callback){
            var oldFileName = model.previous('name');

            if (model.get('name') === oldFileName){ 
                callback(null);
            }

            //Check whether a folder or file_name with same name already exists
            var isNameDuplicate = this.collection.reduce(function( oldResult , iteratorModel, ){
                if(iteratorModel != model && iteratorModel.get('name') === model.get('name') ){
                    return true;
                }
                return oldResult;
            }, false);
            
            if(isNameDuplicate){
                this.set('name', this.previous('name')); 
                return;
            }

            var url = '/api/file/' + this.get('_id');

            $.ajax({
                url : url,
                type: 'PUT',
                data: JSON.stringify({
                    name: model.get('name')
                }),
                contentType: 'application/json',
                dataType: 'json'
            })
            .then(_.bind(function(response){
            }, this))
            .catch(_.bind(function(error){
                this.set('name', this.previous('name')); 
                console.log(error);
            }, this));
        }
    })
});