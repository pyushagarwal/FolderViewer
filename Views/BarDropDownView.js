define(['backbone',
        'text!Templates/BarDropDownTemplate.html'
    ],
    function(Backbone,
    BarDropDownTemplate,
    ){
        
        return Backbone.View.extend({
            // el : "#FileContainer",
            
            // intialize : function($el){
            //     this.$el = $el;
            // },

            render: function($el) {
                var template = _.template(BarDropDownTemplate);
                $el.append(template);
            }

        });

});
