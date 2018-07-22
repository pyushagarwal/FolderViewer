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
            //change the cursor to a pointer
            if(!this.model.isAFile()){
                this.$el.css('cursor','pointer');
            }
            else{
                this.$el.css('cursor','default');
            }
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
                if (!this.model.isAFile()){
                    this.model.collection.fetchFolderContents(this.model);
                }
            }
        }
    });
});