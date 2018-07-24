define(['backbone',
        "backbone-forms",
        ], 
    function(Backbone,
    BackboneForm){
    
        return Backbone.Form.extend({
            
            events : {
                "submit" : "submitForm"
            },

            customRender: function(){
                this.render();

                this.$el.find("input")
                .addClass("form-control");
            },

            submitForm : function(e){
                e.preventDefault();
                var error = this.commit();
                if(error){
                    this.renderErrorMesssage(error);
                }
                else{
                    this.model.login();
                }
            },

            renderErrorMesssage : function(error){

                var $formEl = this.$el;
                $formEl.find(".invalid-feedback").remove();

                Object.keys(error).forEach(function(key){
                     var dataEditorDiv =  $formEl.find(`[data-editors=${key}]`)
                     dataEditorDiv.append(`<div class="invalid-feedback">${error[key]['message']}</div>`)
                    .find('input')
                    .addClass("is-invalid");
                });
                
            } 

        });
});

    