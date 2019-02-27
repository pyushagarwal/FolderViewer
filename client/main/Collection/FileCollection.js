define(["backbone",
"../Models/FileModel",
"./UsersWithAcessCollection"], function(Backbone, FileModel, UsersWithAcessCollection){
    return Backbone.Collection.extend({
        model : FileModel,
        url : "/this is not used",
        //This can be placed in CONFIG

        currentId : 1,

        initialize : function(){
            this.listenTo(window.event_bus, "fetchFolderContents", this.fetchFolderContents);
            this.on("add", this.setIdInModel);
            this.on("add", this.modifySharedWithField);
            this.on("backgrid:selected", function(collection, checked){
                window.event_bus.trigger('rowSelected', collection, checked);
            });
        },

        modifySharedWithField: function(model){
            var listOfSharedUsers = model.get('shared_with');
            if(!(listOfSharedUsers instanceof Backbone.Collection)) {
               model.set('shared_with', new UsersWithAcessCollection(listOfSharedUsers), {silent:true});
            }
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
        fetchFolderContents : function(fileId, shared){
            this.currentId = 1;
            var partToAppend = '';
            if(fileId){
                partToAppend = fileId;
            }
            else if(shared) {
                partToAppend = 'shared';
            }
            
            /*Update the fragment url with the path of the folder
            trigger:false does not trigger the backbone route 
            */
            var url = this.createURL(app.getApiUrl(), partToAppend);

            app.grid.clearSelectedModels();
            Backbone.syncModified('GET', url)
            .then(_.bind(function(response){
                
                this.reset(); 
                this.add(response.files.filter(function(each){
                    return !each.is_root;
                }));
                
                if(shared) {
                    app.currentFolder = {
                        name : '',
                        _id: '',
                        parent_id: '',
                        is_root: true,
                        permission: ["READ"]
                    }
                } else {
                    app.currentFolder = {
                        name : response.name,
                        _id: response.id,
                        parent_id: response.parent_id,
                        is_root: response.is_root,
                        permission: response.permission
                    }
                }
                app.navBarView.changeFolderHeading();
                window.event_bus.trigger("rowSelected");

            }, this))
            .catch(function(error){
                alert(JSON.stringify(error));
                console.log(error);
            });
        }

    })
});