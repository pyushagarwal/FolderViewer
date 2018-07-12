define(['backbone',
        'backgrid',
        'text!Templates/BarDropDownTemplate.html'
    ],
    function(Backbone,
        Backgrid,
        BarDropDownTemplate
    ){
        return Backgrid.Cell.extend({
            
            tagName : "td",

            render : function(){
                return this;
            },

            events :{
                click: "onClick",
                mouseenter: "onMouseEnter",
                mouseleave: "onMouseLeave"
            },

            onClick : function(e){
                e.stopPropagation();
                if(e.target.dataset.action == "rename"){
                    this.$el.find(".dropdown-menu").css("display", 'none');
                    this.rowView.cells[2].enterEditMode();
                    console.log(this);
                }
                else{
                    this.$el.find(".dropdown-menu").css("display", 'block');
                }
            },

            onMouseEnter: function(e){
                this.$el.css("color", "blue");
            },

            onMouseLeave: function(e){
                this.$el.css("color","");
            },

            setRowViewObject : function(rowView){
                this.rowView = rowView;
            }
        });
});
