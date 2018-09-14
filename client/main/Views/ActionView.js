define(['backbone'], 
function(Backbone){
    return Backbone.View.extend({
        el:'#actions-pane',
        
        initialize: function(backgrid){
            this.on("backgrid:selected", function(){
                console.log('row selected');
                console.log(arguments);
            });
        },

        events: {
            // "li onclick": rename 
        }



    });
});