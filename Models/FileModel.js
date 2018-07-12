define(["backbone"], function(Backbone){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "/file",
        
        initialize : function(){
            this.on('change:file_name', this.onModelChange);
        },
        
        getFileExtension : function (filename) {
            return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
        },

        onModelChange: function(){
            // this.set('file_type', this.getFileExtension(this.get('file_name')));
            console.log(this.get("file_name"));
        }
    })
});