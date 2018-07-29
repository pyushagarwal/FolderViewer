define(['backbone',
'../Models/userModel',
'text!../Templates/signInTemplate.html',
'./errorMessage',
'./common'
],
    function(Backbone, UserModel, SignInTemplate, ERROR_MESSAGE, Common){
    
    return Backbone.View.extend({
        
        initialize : function($parentNode){
            this.$parentNode = $parentNode;
            this.user = new UserModel();
        },

        render: function(){
            var signInTemplate = _.template(SignInTemplate);
            this.$parentNode.append(signInTemplate);
            this.setElement('#sign-in-form');
        },

        events: {
            "blur input" : 'inputOnBlur',
            "submit": 'signInUser'
        },

        inputOnBlur : function(e){
            var errMsg = '';
            var field = e.target.name;
            var value = e.target.value;
            this.validateFormFields($(e.target.parentElement), field, value);
        },

        signInUser: function(e){
            e.preventDefault();
            var areFormFieldsValid = true;
            this.$el.serializeArray().forEach(_.bind(function(field){
                var $fieldView = this.$el.find(`[data-editors=${field.name}]`);
                areFormFieldsValid = areFormFieldsValid & 
                                this.validateFormFields($fieldView, field.name, field.value);
            }, this));

            if(areFormFieldsValid){
                this.user.login().then(function(resp){
                    if(resp.status == 200){
                        window.location = window.location.toString().split('/').slice(0,3).join('/') + "/main";
                    }
                }).catch(_.bind(function(error){
                    var $fieldView = this.$el.find(`[data-editors=password]`);
                    if(error && error.status === 401){
                        Common.renderErrorMessage($fieldView, ERROR_MESSAGE.WRONG_PASSWORD);
                    }else{
                        Common.renderErrorMessage($fieldView, ERROR_MESSAGE.TIMEOUT_ERROR);
                    }
                }, this));
            }
        },

        validateFormFields: function($fieldView, field, value){
            
            if(field === 'email'){
                errMsg = Common.validateEmail(value);
            }
            else if(field === 'password'){
                errMsg = Common.validatePassword(value);   
            }
            Common.renderErrorMessage($fieldView, errMsg);
            if(!errMsg){
                this.user.set(field, value);
                return true;
            }else{
                this.user.unset(field);
                return false;
            }
        }


    });
});