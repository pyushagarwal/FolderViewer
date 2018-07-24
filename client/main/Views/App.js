define(['backbone', 
        'backgrid',
        'Views/BackgridRow',
        '../Collection/FileCollection',        
        'Views/BarIconView',
        'moment'
    ], 
    function(Backbone, 
            BackGrid,
            BackgridRow,
            FileCollection,
            BarIconView,
            Moment
        ){
    
    return Backbone.View.extend({
        el : "#FileContainer",
        
        /*custom variables*/

        getApiUrl : function(){
            return this.API_URL;
        },

        initialize : function(){
            
            this.API_URL = '/api/file',
            this.grid = null;
            this.fileCollection = new FileCollection();
            this.createGrid();
        },

        createGrid : function(){
            var columns = [
            {
                name: "id", // The key of the model attribute
                label: "ID", // The name to display in the header
                sortType: "toggle",
                editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                // Defines a cell type, and ID is displayed as an integer without the ',' separating 1000s.
                cell: Backgrid.IntegerCell.extend({
                  orderSeparator: ''
                })
              },
              {
                name: "", // The key of the model attribute
                label: "", // The name to display in the header
                editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                // Defines a cell type, and ID is displayed as an integer without the ',' separating 1000s.
                cell: Backbone.View.extend({
                    tagName : "td",

                    render : function(){
                        var html = '';
                        if (this.model.isAFile()){
                            html = '<i class="far fa-file-alt"></i>'
                        }
                        else{
                            html = '<i class="fas fa-folder"></i>'
                        }
                        this.$el.html(html);
                        return this
                    }
                })
              }, {
                name: "file_name",
                label: "Name",
                sortType: "toggle",
                // The cell type can be a reference of a Backgrid.Cell subclass, any Backgrid.Cell subclass instances like *id* above, or a string
                cell: Backgrid.Cell.extend({
                    events: {
                        'click': 'onClick'
                    },

                    onClick(e){
                        // stop the default behaviour of Cell class to enter editmode on clicking;
                    }

                }), // This is converted to "StringCell" and a corresponding class in the Backgrid package namespace is looked up
                editable: true
              }, {
                name: "mtime",
                label: "Date Modified",
                sortType: "toggle",
                cell: Backgrid.DatetimeCell.extend({
                    includeMilli: true,
                    formatter : _.extend({
                        fromRaw : function(time, model){
                            var moment = new Moment(time);
                            return moment.format('DD/MM/YY h:mm:s a');
                        }
                    }, Backgrid.CellFormatter)
                }),
                editable: false
                
              },
              {
                name: "", // The key of the model attribute
                label: "", // The name to display in the header
                editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                // Defines a cell type, and ID is displayed as an integer without the ',' separating 1000s.
                cell: BarIconView
                
            }];
            
            this.grid = new BackGrid.Grid({
                className : 'table table-hover',
                columns : columns,
                collection : this.fileCollection,
                row : BackgridRow
            });

            this.$el.append(this.grid.render().el);

        }
    })
});