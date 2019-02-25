define(['backbone', 
        'backgrid',
        'Views/BackgridRow',
        '../Collection/FileCollection',        
        'Views/BarIconView',
        'moment',
        'backgrid-select-all',
        'Views/ActionView',
        'Views/UploadListView',
        '../Models/FileModel'
    ], 
    function(Backbone, 
            BackGrid,
            BackgridRow,
            FileCollection,
            BarIconView,
            Moment,
            BackgridSelectAll,
            ActionView,
            UploadListView,
            FileModel
        ){
    
    return Backbone.View.extend({
        el : "#content-pane",
        
        /*custom variables*/

        getApiUrl : function(){
            return this.API_URL;
        },

        initialize : function(){
            
            this.API_URL = '/api/file',
            this.grid = null;
            this.fileCollection = new FileCollection();
            this.createGrid();
            this.actionView = new ActionView(this.grid);
        },

        createGrid : function(){
            var columns = [
                {
                    // name is a required parameter, but you don't really want one on a select all column
                    name: "",
                    // Backgrid.Extension.SelectRowCell lets you select individual rows
                    cell: Backgrid.Extension.SelectRowCell,
                    // Backgrid.Extension.SelectAllHeaderCell lets you select all the row on a page
                    headerCell: Backgrid.Extension.SelectAllHeaderCell
                }, 
                // {
                //     name: "position", // The key of the model attribute
                //     label: "ID", // The name to display in the header
                //     sortType: "toggle",
                //     editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                //     // Defines a cell type, and ID is displayed as an integer without the ',' separating 1000s.
                //     cell: Backgrid.IntegerCell.extend({
                //         orderSeparator: ''
                //     })
                // },
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
                    name: "name",
                    label: "Name",
                    sortType: "toggle",
                    // The cell type can be a reference of a Backgrid.Cell subclass, any Backgrid.Cell subclass instances like *id* above, or a string
                    cell: Backbone.View.extend({
                        
                        tagName : "td",

                        render: function(){
                            this.$el.html(this.model.get('name'));
                            return this;
                        },

                        enterEditMode: function(){
                            this.$el.empty();
                            var name = this.model.get('name');
                            this.$el.html(`<input class="form-control form-control-sm" value="${name}"> <div class='name_error'></div>`);  
                        },

                        exitEditMode: function(){
                            this.$el.empty();
                            var name = this.model.get('name');
                            this.$el.html(name);  
                        },

                        showErrorMessage: function(error){
                            this.$el.find('.name_error').html(error.error);
                            $(this.$el.find('input')).css('border', '2px solid red');
                        }

                    }), // This is converted to "StringCell" and a corresponding class in the Backgrid package namespace is looked up
                    editable: false
                }, {
                    name: "modified_on",
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
                    
                }, {
                    name: "modified_by",
                    label: "Modified By",
                    sortType: "toggle",
                    cell: Backgrid.Cell.extend({
                        events: {
                            'click': 'onClick'
                        },
                        // stop the default behaviour of Cell class to enter editmode on clicking;
                        onClick(e){},
                        formatter : _.extend({
                            fromRaw : function(modified_by, model){
                                return modified_by.name;
                            }
                        }, Backgrid.CellFormatter)
                    }), 
                    editable: false
                }, {
                    name: "", // The key of the model attribute
                    label: "", // The name to display in the header
                    editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                    // Defines a cell type, and ID is displayed as an integer without the ',' separating 1000s.
                    cell: Backbone.View.extend({
                        tagName : "td",

                        events:{
                            'click button': 'saveName'
                        },

                        render : function(){
                            
                            this.listenTo(window.event_bus,'fileEdit', function(backgridRow){
                                if(this.model === backgridRow.model){
                                    this.model.rowView = backgridRow;
                                    var $button = $(this.$el.find('button')[0]);
                                    $button.css('display','');    
                                }
                            });

                            this.$el.html('<button type="button" class="btn btn-outline-primary btn-sm" style="display:None;">Save</button>');
                            return this;
                        },
                        
                        saveName: function(){
                            var newName = $(this.model.rowView.cells[2].$el.find('input')).val();
                            this.model.renameFile(newName, _.bind(function(error){
                                if(!error){
                                    var $button = $(this.$el.find('button')[0]);
                                    $button.css('display','None');
                                    this.model.rowView.cells[2].exitEditMode();
                                    // app.grid.sort('id', null);
                                } else {
                                    this.model.rowView.cells[2].showErrorMessage(error);
                                }
                            }, this));
                            return false;
                        }
                    }),
                },
                {
                    name: "", // The key of the model attribute
                    label: "", // The name to display in the header
                    editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                    // Defines a cell type, and ID is displayed as an integer without the ',' separating 1000s.
                    cell: BarIconView
                }, 
            ];
            
            this.grid = new BackGrid.Grid({
                className : 'table table-hover',
                columns : columns,
                collection : this.fileCollection,
                row : BackgridRow
         
            });

            this.grid.listenTo(window.event_bus, "uploadProgress", function(fileDetails) {
                if(fileDetails.percent == 101) {
                    if(fileDetails.response){
                        var fileModel = new FileModel(fileDetails.response);
                        this.collection.add(fileModel, { at: 0});   
                    }
                    if(fileDetails.error) {
                        alert(fileDetails.error.error);
                    }
                }
            });
                

            this.$el.append(this.grid.render().el);
            this.uploadListView = new UploadListView();
        }
    })
});