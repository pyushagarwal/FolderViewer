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

        /**Display the relevant actions for the model
        *@param model : Backbone.Model
        *@param checked : Boolean
        */
        showActions: function(selectedModels, checked){
            // var selectedModels = this.grid.getSelectedModels();
            // selectedModels.add(model);
            
            var cumulativeAction = 3;

            selectedModels.forEach(function(model){
                var userId = model.get('_id');
                var sharedWith = _.find(model.get('shared_with'), function(permission){
                    return permission.user_id === userId; 
                });
                var action = sharedWith.action[0];
                cumulativeAction = min(ACTIONS[action], cumulativeAction);
            });

            this.renderActionsOnScreen(cumulativeAction);
        },

        renderActionsOnScreen: function(cumulativeAction){
            var $ul = this.$el.find('ul');
            $ul.empty();

            /*If the root folder has permission to add folder and upload,then show it */
            if(this.ACTIONS[app.currentFolder.permission] >= 1){
                $ul.append(`<li class="list-group-item">${languageConstants.ADD_FOLDER}</li>`);
                $ul.append(`<li class="list-group-item">${languageConstants.UPLOAD}</li>`);
            }

            if(this.ACTIONS[cumulativeAction] >= 0){
                $ul.append(`<li class="list-group-item">${languageConstants.DOWNLOAD}</li>`);    
            }
            if(this.ACTIONS[cumulativeAction] >= 2){
                $ul.append(`<li class="list-group-item">${languageConstants.DELETE}</li>`);    
            }
            if(this.ACTIONS[cumulativeAction] == 3){
                $ul.append(`<li class="list-group-item">${languageConstants.SHARE}</li>`);    
            }

        }
    });
});