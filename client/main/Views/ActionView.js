define(['backbone',
    '../languageConstants.js',
    '../Models/FileModel',
    'Views/ShareView',
    'Views/UploadModal'
], 
function(Backbone, languageConstants, FileModel, ShareView, UploadModal){
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
            'click a': 'performAction'
        },
        
        /** This is the click event handler for each anchor tag
        *@param e JqueryEventObject
         */
        performAction: function(e) {
            e.preventDefault();
            var action = e.target.dataset.action;
            if(action === "rename") {
                var selectedModelsArray = this.grid.getSelectedModels();
                if(selectedModelsArray.length !== 1){
                    console.log('only 1 file can be renamed at a time');
                }

                this.grid.body.rows.forEach( function(backgridRow){
                    if(backgridRow.model === selectedModelsArray[0]){
                        backgridRow.cells[2].enterEditMode();
                        window.event_bus.trigger('fileEdit', backgridRow);
                    }
                })
            }

            else if(action === "add"){
                var file = new FileModel({
                    parent_id: app.currentFolder._id,
                })
                this.grid.collection.add(file, {at: 0});
                this.grid.body.rows.forEach( function(backgridRow){
                    if(backgridRow.model === file){
                        backgridRow.cells[2].enterEditMode();
                        window.event_bus.trigger('fileEdit', backgridRow);
                    }
                });
            }

            else if(action === 'delete') {
                var selectedModelsArray = this.grid.getSelectedModels();
                
                if(selectedModelsArray.length !== 1){
                    alert(JSON.stringify('only 1 file can be renamed at a time'));
                    console.log('only 1 file can be renamed at a time');
                }
                
                var showActions = this.showActions;

                var targetBackgridRow = this.grid.body.rows.reduce(function( oldResult , backgridRow){
                    if(backgridRow.model === selectedModelsArray[0]){
                        return backgridRow;
                    }
                    return oldResult;
                }, null);

                targetBackgridRow.model.deleteFile(_.bind(function(error){
                    if(!error){
                        targetBackgridRow.remove();
                        app.grid.collection.remove(targetBackgridRow.model);
                        this.showActions();
                    } else {
                        alert(JSON.stringify(error));
                    }
                }, this));
            }

            else if(action === 'share') {
                var selectedModelsArray = this.grid.getSelectedModels();
                shareView = new ShareView();
                shareView.selectedModel = selectedModelsArray[0];
                this.$el.append(shareView.render().el);
            }

            else if(action === 'upload') {
                var uploadModal = new UploadModal();
                this.$el.append(uploadModal.render().el);
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
                var userPermission = model.get('shared_with').find({user_id: idOfCurrentUser});
                var action = userPermission.get('action')[0];
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

            var attributes= 'class="list-group-item list-group-item-action" href="#"'
            /*If the root folder has permission to add folder and upload,then show it */
            if(this.ACTIONS[app.currentFolder.permission] >= 1){
                $ul.append(`<a ${attributes} data-action="add"  >${languageConstants.ADD_FOLDER}</a>`);
                $ul.append(`<a ${attributes} data-action="upload"> ${languageConstants.UPLOAD}</a>`);
                if(selectedModelsCollection.size() === 1){
                    $ul.append(`<a ${attributes}  data-action="rename"> ${languageConstants.RENAME}</a>`);
                }
            }

            if(cumulativeAction >= 0 && selectedModelsCollection.size() == 1){
                $ul.append(`<a ${attributes} data-action="download">${languageConstants.DOWNLOAD}</a>`);    
            }
            if(cumulativeAction >= 2 && selectedModelsCollection.size() == 1){
                $ul.append(`<a ${attributes} data-action="delete" >${languageConstants.DELETE}</a>`);    
            }
            if(cumulativeAction == 3 && selectedModelsCollection.size() == 1){
                $ul.append(`<a ${attributes} data-action="share"> ${languageConstants.SHARE}</a>`);    
            }

        }
    });
});