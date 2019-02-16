define(['backbone',
    'text!Templates/ShareDialogTemplate.html'
],
function(Backbone, ShareDialogTemplate){
    return Backbone.View.extend({
        render: function() {
            this.template= _.template(ShareDialogTemplate);
        }
    })
}); 