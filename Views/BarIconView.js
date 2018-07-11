define(['backbone',
        'Views/BarDropDownView'
    ],
    function(Backbone,
        BarDropDownView
    ){
        return Backbone.View.extend({
            
            tagName : "td",

            render : function(){
                this.$el.html();
                return this;
            },

            events :{
                click: "onClick",
                mouseenter: "onMouseEnter",
                mouseleave: "onMouseLeave"
            },

            onClick : function(e){
                e.stopPropagation();
                console.log("tododo clicked");
                this.barDropDownView = new BarDropDownView();
                this.barDropDownView.render(this.$el);

            },

            onMouseEnter: function(e){
                this.$el.css("color", "blue");
            },

            onMouseLeave: function(e){
                this.$el.css("color","");
            }
        });
});
