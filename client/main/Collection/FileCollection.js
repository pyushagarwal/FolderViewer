define(["backbone", "../Models/FileModel"], function(Backbone, FileModel){
    return Backbone.Collection.extend({
        model : FileModel,
        url : "/this is not used",
        //This can be placed in CONFIG

        currentId : 1,
        
        fetchData : function(url){
            this.url = url;
            this.sync('read',this)
            .then(_.bind(function(response){
                this.add(response.files);
                
                app.currentFolder = {
                    name : response.name,
                    _id: response.id,
                    parent_id: response.parent_id,
                    is_root: response.is_root,
                    permission: response.permission
                }

                window.event_bus.trigger("rowSelected");

            }, this))
            .catch(function(error){
                console.log(error);
            });
        },

        initialize : function(){
            this.listenTo(window.event_bus, "fetchFolderContents", this.fetchFolderContents);
            this.on("add", this.setIdInModel);
            this.on("add", this.modifySharedWithField);
            this.on("backgrid:selected", function(collection, checked){
                window.event_bus.trigger('rowSelected', collection, checked);
            });
        },

        modifySharedWithField: function(model){
            console.log('invoked');
            var listOfSharedUsers = model.get('shared_with');
            model.set('shared_with', new Backbone.Collection(listOfSharedUsers));
        },

        setIdInModel: function(model){
            model.set("position", this.currentId);
            this.currentId += 1;
        },

        createURL : function(old_url, to_be_appended){
            if(to_be_appended){
                return old_url + "/" + to_be_appended;
            }else{
                return old_url;
            }
        },

        /**Fetch the contents of a folder
        *@param fileModel model
        */
        fetchFolderContents : function(fileModel){
            this.currentId = 1;
            var fileId;
            if(fileModel){
                fileId = fileModel.get('_id');
            }
            // var newFragment = this.createURL(Backbone.history.fragment, fileId);
            
            /*Update the fragment url with the path of the folder
            trigger:false does not trigger the backbone route 
            */
            // router.navigate(newUrl, {trigger: false});
            
            var newUrl = this.createURL(app.getApiUrl(), fileId);
            this.reset();
            this.fetchData(newUrl);
        }

    })
});