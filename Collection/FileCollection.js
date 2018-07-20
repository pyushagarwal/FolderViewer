define(["backbone", "../Models/FileModel"], function(Backbone, FileModel){
    return Backbone.Collection.extend({
        model : FileModel,
        url : "/this is not used",

        //This can be placed in CONFIG
        API: "/api/file",

        currentId : 1,
        
        fetchData : function(url){
            this.url = url
            this.fetch().fail(function(){
                console.log(arguments);
            });
        },

        initialize : function(){
            this.listenTo(window.event_bus, "resetFileCollection", this.resetFileCollection);
            this.on("add", this.setIdInModel)
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

        /*
        params: FolderNameWhichWasClicked , type = Model
        */
        resetFileCollection : function(FolderNameWhichWasClicked){
            this.currentId = 1;
            if(FolderNameWhichWasClicked){
                var file_name = FolderNameWhichWasClicked.get('file_name');
            }
            var newUrl = this.createURL(Backbone.history.fragment, file_name);
            
            /*Update the fragment url with the path of the folder
            trigger:false does not trigger the backbone route 
            */
            router.navigate(newUrl, {trigger: false});
            
            var newUrl = this.createURL(this.API, newUrl);
            this.reset()
            this.fetchData(newUrl);
        }

    })
});