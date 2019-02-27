define(['backbone', './signInView', './signUpView'],
function(Backbone, SignInView, SignUpView){
    return Backbone.View.extend({
        el: '#central-container',

        events : {
            'click #show-sign-in': 'showSignInForm',
            'click #show-sign-up': 'showSignUpForm'
        },

        initialize: function(){
            this.signInView = new SignInView(this.$el);
            this.signInView.render();
            this.signUpView = new SignUpView(this.$el);
            this.signUpView.render();
            this.showSignInForm();
        },

        showSignInForm: function(){
            this.signInView.$el.removeClass('hidden');
            this.signUpView.$el.addClass('hidden');
        },

        showSignUpForm: function(){
            this.signInView.$el.addClass('hidden');
            this.signUpView.$el.removeClass('hidden');
        }
    });

});