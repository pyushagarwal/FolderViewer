define(['./errorMessage',],
function(ERROR_MESSAGE){
    return {
        validateEmail: function(email) {
            if(!email){
                return ERROR_MESSAGE.EMAIL_REQUIRED
            }
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(re.test(String(email).toLowerCase())){
                return "";
            }else{
                return ERROR_MESSAGE.EMAIL_INVALID; 
            }
        },

        validatePassword: function(password){
            if(!password){
                return ERROR_MESSAGE.PASSWORD_REQUIRED;
            }
            return "";
        },

        renderErrorMessage($div, errMsg){
            if (errMsg){
                $div.find('input').addClass('is-invalid');
                $div.find('.invalid-feedback').html(errMsg);
            }
            else {
                $div.find('input').removeClass('is-invalid');
            }
        }
    }
});