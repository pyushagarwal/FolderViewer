define(['backbone',
    '../languageConstants.js'], 
function(Backbone, languageConstants){
    return Backbone.View.extend({
        initialize: function(backgrid){
            this.grid = backgrid
            this.listenTo(window.event_bus, 'rowSelected', this.showActions);
            this.setElement('#actions-pane');
            this.ACTIONS = {
                "READ" : 0,
                "WRITE" : 1,
                "DELETE": 2,
                "GRANT": 3
            }
        },

        events:{
            'click li': 'performAction'
        },
        
        
        performAction: function(e){
            var action = e.target.dataset.action;
            if(action === "rename"){
                var selectedModelsArray = this.grid.getSelectedModels();
                var selectedIndex = selectedModelsArray[0];
                this.grid.body.rows[0].cells[3].enterEditMode();
            }
        },


        /**Display the relevant actions for the selected files
        *@param model : Backbone.Model
        *@param checked : Boolean
        */
        showActions: function(model, checked){
            var selectedModelsArray = this.grid.getSelectedModels();
            var selectedModelsCollection = new Backbone.Collection(selectedModelsArray);
            if(checked){
                selectedModelsCollection.add(model);
            } else {
                selectedModelsCollection.remove(model);
            }
            var cumulativeAction = 10;

            selectedModelsCollection.forEach(function(model){
                var idOfCurrentUser = document.cookie.split(';')[0].split('=')[1];
                var userPermission = _.find(model.get('shared_with'), function(permission){
                    return permission.user_id === idOfCurrentUser; 
                });
                var action = userPermission.action[0];
                cumulativeAction = Math.min(this.ACTIONS[action], cumulativeAction);
            }, this);

            if(cumulativeAction == 10){
                cumulativeAction = this.ACTIONS.READ;
            }
            this.renderActionsOnScreen(cumulativeAction, selectedModelsCollection);
        },

        renderActionsOnScreen: function(cumulativeAction, selectedModelsCollection){
            var $ul = this.$el.find('ul');
            $ul.empty();

            /*If the root folder has permission to add folder and upload,then show it */
            if(this.ACTIONS[app.currentFolder.permission] >= 1){
                $ul.append(`<li class="list-group-item" data-action="addfolder" >${languageConstants.ADD_FOLDER}</li>`);
                $ul.append(`<li class="list-group-item">${languageConstants.UPLOAD}</li>`);
                if(selectedModelsCollection.size() === 1){
                    $ul.append(`<li class="list-group-item" data-action="rename">${languageConstants.RENAME}</li>`);
                }
            }

            if(cumulativeAction >= 0 && selectedModelsCollection.size() == 1){
                $ul.append(`<li class="list-group-item">${languageConstants.DOWNLOAD}</li>`);    
            }
            if(cumulativeAction >= 2){
                $ul.append(`<li class="list-group-item">${languageConstants.DELETE}</li>`);    
            }
            if(cumulativeAction == 3){
                $ul.append(`<li class="list-group-item">${languageConstants.SHARE}</li>`);    
            }

        }
    });
});