define(["backbone", "../Models/FileModel"], function(Backbone, FileModel){
    return Backbone.Collection.extend({
        model : FileModel,
        url : "/this is not used",

        API: "/api",
        currentId : 1,
        
        fetchData : function(url){
            this.url = url
            this.fetch()
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

        resetFileCollection : function(model){
            this.currentId = 1;
            if(model){
                var file_name = model.get('file_name');
            }
            var newUrl = this.createURL(Backbone.history.fragment, file_name);
            router.navigate(newUrl, {trigger: false});
            
            var newUrl = this.createURL(this.API, newUrl);
            this.reset()
            this.fetchData(newUrl);
        }

    })
});