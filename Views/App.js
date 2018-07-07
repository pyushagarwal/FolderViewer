define(['backbone',
        'text!Templates/FileContainerTemplate.html', 
        './BBGridView',
        '../Collection/FileCollection' 
    ], 
    function(Backbone,
            FileContainerTemplate, 
            BBGridView, 
            FileCollection){
    
    return Backbone.View.extend({
        el : "#BodyDiv",
        
        initialize : function(){
            this.bbGridView = null;
            this.fileCollection = new FileCollection();
            this.createGrid($("#FileContainer"), this.fileCollection);
            this.listenTo(window.event_bus, "resetFileCollection", this.resetFileCollection);
        },

        createGrid : function($el, fileCollection){
            this.bbGridView = new BBGridView({
                container: $el,
                collection: fileCollection,
                onRowClick : function(model){
                    window.event_bus.trigger("resetFileCollection", model);
                }
            });
        }
    })
});