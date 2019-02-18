define(['backbone',
    'text!Templates/ShareDialogTemplate.html',
    'backbone-modal',
    'backgrid',
    '../languageConstants.js'
],
function(Backbone,
    ShareDialogTemplate,
    BackboneModal,
    BackGrid,
    LanguageConstants){
    return Backbone.Modal.extend({
        template: _.template(ShareDialogTemplate, {READ: 'read'}),
        cancelEl: '.bbm-button',
        onRender: function() {
            this.userCollection = new Backbone.Collection(this.selectedModel.get('shared_with'));
            
            sample = {
                name: 'rohit agarwal',
                email: 'attitude.rohit@gmail.com',
                action:['WRITE'],
                save:'save',
                cancel: 'cancel'
            };
            this.userCollection.add(new Backbone.Model(sample));
            this.userCollection.add(new Backbone.Model(sample));
            this.userCollection.add(new Backbone.Model(sample));
            this.userCollection.add(new Backbone.Model(sample));
            this.userCollection.add(new Backbone.Model(sample));

            this.grid = new BackGrid.Grid({
                className : 'shared_user_table table table-hover',
                columns : [
                    {
                        name: "name", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: "toggle",
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: BackGrid.Cell // The cell field is mandatory
                    },
                    {
                        name: "email", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: "toggle",
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: BackGrid.Cell
                    },
                    {
                        name: "action", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: false,
                        cell: Backgrid.SelectCell.extend({
                            optionValues: [
                                ["Read", "READ"], 
                                ["Write", "WRITE"],
                                ["Delete", "DELETE"],
                                ["Grant", "GRANT"],
                            ]
                        })
                    },
                    {
                        name: "", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: "toggle",
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: BackGrid.Cell
                    },
                    {
                        name: "", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: "toggle",
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: BackGrid.Cell
                    }
                ],
                collection : this.userCollection
            });
            this.$el.find('#shared_user_list').append(this.grid.render().el);
        }
    });
}); 