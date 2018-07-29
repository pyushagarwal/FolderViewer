define(['backbone',
'../Models/userModel',
'text!../Templates/signUpTemplate.html',
'./errorMessage',
'./common'
],
function(Backbone, UserModel, SignUpTemplate, ERROR_MESSAGE, Common){
    return Backbone.View.extend({
        initialize : function($parentNode){
            this.$parentNode = $parentNode;
            this.user = new UserModel();
        },

        events: {
            "blur input": 'inputOnBlur',
            "submit": 'signUpUser'
        },

        render: function(){
            var signUpTemplate = _.template(SignUpTemplate);
            this.$parentNode.append(signUpTemplate);
            this.setElement('#sign-up-form');
        },

        inputOnBlur : function(e){
            var errMsg = '';
            var field = e.target.name;
            var value = e.target.value;
            this.validateFormFields($(e.target.parentElement), field, value);
        },

        validateFormFields: function($fieldView, field, value){
            if(field === "name"){
                errMsg = this.validateName(value);
            }
            else if(field === 'email'){
                errMsg = Common.validateEmail(value);
            }
            else if(field === 'password'){
                errMsg = Common.validatePassword(value);   
            }
            else if(field === 'confirm-password'){
                errMsg = this.matchPassword(value);
            }

            Common.renderErrorMessage($fieldView, errMsg);
            if(!errMsg){
                this.user.set(field, value);
                return true;
            }else{
                this.user.unset(field);
                return false;
            }
        },

        signUpUser: function(e){
            e.preventDefault();
            var areFormFieldsValid = true;
            this.$el.serializeArray().forEach(_.bind(function(field){
                var $fieldView = this.$el.find(`[data-editors=${field.name}]`);
                areFormFieldsValid = areFormFieldsValid & 
                                this.validateFormFields($fieldView, field.name, field.value);
            }, this));

            if(areFormFieldsValid){
                this.user.register().then(function(resp){
                    if(resp.status == 200){
                        window.location = window.location.toString().split('/').slice(0,3).join('/') + "/main";
                    }
                }).catch(_.bind(function(error){
                    var $fieldView = this.$el.find(`[data-editors=email]`);
                    if(error && error.status === 401){
                        Common.renderErrorMessage($fieldView, ERROR_MESSAGE.WRONG_PASSWORD);
                    }else{
                        Common.renderErrorMessage($fieldView, ERROR_MESSAGE.TIMEOUT_ERROR);
                    }
                }, this));
            }

        },

        validateName: function(value){
            if(!value){
                return ERROR_MESSAGE.NAME_REQUIRED;
            }
            return '';
        },

        matchPassword: function(formvalue){
            if(formvalue === this.user.get('password')){
                return '';
            }else{
                return ERROR_MESSAGE.PASSWORD_MISMATCH;
            }
        }



    });
});