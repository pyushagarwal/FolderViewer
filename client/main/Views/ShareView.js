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
            this.usersWithAccess = this.selectedModel.get('shared_with');
            this.listenTo(window.event_bus, 'userAccessModified', this.userAccessModified);
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
                        sortType: "toggle",
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: BackGrid.Cell
                    },
                    // {
                    //     name: "action", // The key of the model attribute
                    //     label: "", // The name to display in the header
                    //     sortType: false,
                    //     cell: Backgrid.SelectCell.extend({
                    //         optionValues: [
                    //             ["Read", "READ"], 
                    //             ["Write", "WRITE"],
                    //             ["Delete", "DELETE"],
                    //             ["Grant", "GRANT"],
                    //         ]
                    //     })
                    // },
                    {
                        name: "",
                        label: "",
                        sortType: false,
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: Backbone.View.extend({
                            tagName : "td",
                            events:{
                                'click button': 'modifyAccess'
                            },
                            modifyAccess: function(e) {
                                window.event_bus.trigger("userAccessModified", false, $(e.target).data()['email']);
                            },
                            render : function(){ 
                                this.$el.html(`<button class="btn btn-outline-primary btn-sm" data-email="${this.model.get('email')}">Modify</button>`);
                                return this;
                            },
                        })
                    },
                    {
                        name: "",
                        label: "",
                        sortType: false,
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: Backbone.View.extend({
                            tagName : "td",
                            events:{
                                'click button': 'removeAccess'
                            },
                            removeAccess: function(e) {
                                window.event_bus.trigger("userAccessModified", true, $(e.target).data()['email']);
                            },
                            render : function(){ 
                                this.$el.html(`<button class="btn btn-outline-primary btn-sm" data-email="${this.model.get('email')}">Revoke</button>`);
                                return this;
                            },
                        })
                    }
                ],
                collection : this.usersWithAccess
            });
            this.$el.find('#shared_user_list').append(this.grid.render().el);
        },

        events: {
            'submit': 'shareWithNewUser'
        },

        userAccessModified: function(toBeDeleted, email) {
            
            var userAccessToBeModified = this.usersWithAccess.find({email: email});

            if(toBeDeleted){
                this.selectedModel.removeUserAccess(userAccessToBeModified, _.bind(function(error){
                    if(error) {
                        alert("Error occured while removing user access");
                    } else {
                        this.usersWithAccess.remove(userAccessToBeModified);
                    }
                }, this));
            } else {
                this.$el.find('#share_form input[name=email]').val(email);
                this.$el.find('#share_form select[name=action]').val(userAccessToBeModified.get('action')[0]).focus();
            }
        },

        shareWithNewUser: function(e) {
            e.preventDefault();
            console.log('Share form submitted');
            var formValues = this.$el.find('#share_form').serializeArray();
            this.selectedModel.provideAccess(formValues, _.bind(function(error, response){
                if(error) {
                    if(error.status == 400 && error.responseJSON.error === 'User with email id does not exists') {
                        alert('User with email id does not exists');
                    } else {
                        alert('An error occurred');
                    }
                } else {
                    this.usersWithAccess.remove({email: response.shared_with[0].email});
                    this.usersWithAccess.add(response.shared_with[0]);
                }
            }, this));
        }

    });
}); 