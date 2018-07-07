define(["backbone"], function(Backbone){
    return Backbone.Model.extend({
        idAttribute : 'id',
        url : "/file"
    })
});