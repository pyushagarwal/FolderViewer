define(['backbone'], function(Backbone){
    return Backbone.Router.extend({

        initialize: function(){
            this.route(/.*/, 'home' , this.home)
        },

        home : function(){
            console.log("rendering route");
            var fragment = Backbone.history.fragment;
            if(fragment === 'shared') {
                window.event_bus.trigger('fetchFolderContents', null, true);
            } else {
                window.event_bus.trigger('fetchFolderContents', fragment);
            }
        }
    });
});