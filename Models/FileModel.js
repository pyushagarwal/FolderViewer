define(["backbone", 
        "Utils/common"], function(Backbone, Common){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "",
        
        initialize : function(){
            this.on("backgrid:edited", this.fileRenamed);
            this.on("backgrid:editing", this.editMode)
        },
        
        getFileExtension : function (filename) {
            var filename = this.get("file_name");
            return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
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
        },

        editMode: function(){
            backGridCell = arguments[2];
            console.log(backGridCell.scrollY);
            window.scrollTo(0, 600);
            console.log("hello");
        }
    })
});