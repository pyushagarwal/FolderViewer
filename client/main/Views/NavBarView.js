define(['backbone',
], 
function(Backbone){
    return Backbone.View.extend({
        el: "#folder-heading-nav-bar",
        changeFolderHeading: function() {
            if(!app.currentFolder.is_root) {
                this.$el.find("#folder-name").html(app.currentFolder.name);
            } else {
                this.$el.find("#folder-name").html('');
            }
        }
    });
});