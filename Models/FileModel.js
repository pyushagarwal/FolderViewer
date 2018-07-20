define(["backbone", 
        "Utils/common"], function(Backbone, Common){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "/api/file",
        
        initialize : function(){
            this.on("backgrid:edited", this.fileRenamed);
            // this.on("backgrid:editing", this.editMode)
        },
        
        hasFileExtension : function (filename) {
            var filename = this.get("file_name");
            var fileExtension =  filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
            if(fileExtension){
                return true;
            }
            else{
                return false;   
            }
        },

        fileRenamed: function(model, backgridRow){
            var oldFileName = model.previous('file_name');

            if (model.get('file_name') === oldFileName){ 
                return;
            }
            var url = Common.createUrl(app.getApiUrl(), Backbone.history.fragMent);
            url = Common.createUrl(url, oldFileName);
            this.url = url;

            Backbone.sync('update', this)
            .fail(_.bind(function(){
                this.set('file_name', this.previous('file_name')); 
            }, this));
        }
    })
});