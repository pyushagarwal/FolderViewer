define(['backbone'], function(Backbone){
    return Backbone.Router.extend({

        initialize: function(){
            console.log("Router initialized");
            this.route(/.*/, 'home' , this.home)
        },

        home : function(){
            console.log("rendering home")
            window.event_bus.trigger('resetFileCollection', null);
        }
    });
});