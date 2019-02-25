define(['backbone'], function(Backbone){
    return Backbone.Collection.extend({
        modelId: function(attrs){
            return attrs.email;
        }
    });
});