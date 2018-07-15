define(['backgrid',
        'text!Templates/BarDropDownTemplate.html'], 
function(
    Backgrid,
    BarDropDownTemplate)
{
    return Backgrid.Row.extend({
        events : {
            mouseleave : "onMouseLeave",
            mouseenter : "onMouseEnter",
            click : "onClick"
        },

        onMouseEnter(e){
            // console.log('mouseenter triggered');

            //change the cursor to a pointer
            this.$el.css('cursor','pointer');
            
            //add a bar font;
            this.cells[this.cells.length-1].setRowViewObject(this);
            this.cells[this.cells.length-1].$el.html(_.template(BarDropDownTemplate));

        },

        onMouseLeave(e){
            // console.log('mouseleave triggered');
            this.$el.css('cursor','');
            this.cells[this.cells.length-1].$el.html('');
        },

        onClick(e){
            if(e.target.tagName === "INPUT"){
                e.stopPropagation();
            }else{
                this.model.collection.resetFileCollection(this.model);
            }
        }
    });
});