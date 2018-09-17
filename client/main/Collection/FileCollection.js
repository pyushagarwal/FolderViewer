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
                    permission: response.permission
                }

            }, this))
            .catch(function(error){
                console.log(error);
            });
        },

        initialize : function(){
            this.listenTo(window.event_bus, "fetchFolderContents", this.fetchFolderContents);
            this.on("add", this.setIdInModel);
            this.on("backgrid:select-all", function(collection, checked){
                window.event_bus.trigger('rowSelected', collection, checked);
            });
        },

        setIdInModel: function(model){
            model.set("id", this.currentId);
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
            var newFragment = this.createURL(Backbone.history.fragment, fileId);
            
            /*Update the fragment url with the path of the folder
            trigger:false does not trigger the backbone route 
            */
            router.navigate(newUrl, {trigger: false});
            
            var newUrl = this.createURL(app.getApiUrl(), newFragment);
            this.reset();
            this.fetchData(newUrl);
        }

    })
});