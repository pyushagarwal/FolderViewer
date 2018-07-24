define(['backbone',
        "./FormView",
        "text!Templates/LoginTemplate.html"], 
function(Backbone,
    FormView,
    LoginTemplate){
    
    return Backbone.View.extend({
        el : '#LoginDiv',

        initialize : function(){

            var User = Backbone.Model.extend({

                url :"/api/auth/login",

                schema: {
                    email: { validators: ['required', 'email'] },
                    password: { 
                        type: 'Password',
                        validators: ['required'] 
                    }
                },

                login: function(){
                    Backbone.sync("create", this)
                    .then(function(res){
                        console.log(res);
                    })
                    .fail(function(e){
                        console.log(e);
                    })
                }
            });
            
            this.model = new User();
        },

        render : function(){
            this.form = new FormView({
                model:  this.model,
                
                template: _.template(LoginTemplate)
            });

            this.form.customRender();

            this.$el.append(this.form.el);
            
        },

        

    });
});