define(['backbone'], function(Backbone){
    return Backbone.Model.extend({

        url :"",

        login: function(){
            this.url = '/api/auth/login';
            return Backbone.sync("create", this);
        },

        register: function(){
            this.url = '/api/user';
            this.unset('confirm-password');
            return Backbone.sync("create", this);
        }
    });
});