define(['backbone', 'backgrid'],
function(Backbone, BackGrid){
    return Backbone.View.extend({
        el: "#uploads_pane",

        initialize: function() {
            this.listenTo(window.event_bus, "uploadProgress", this.updateUploadStatus);
            this.uploadCollection = new Backbone.Collection();
            this.uploadGrid = new BackGrid.Grid({
                className : 'table table-hover',
                columns : [
                    {
                        name: "file_name", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: false,
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: BackGrid.Cell, // The cell field is mandatory
                    }, 
                    {
                        name: "percent", // The key of the model attribute
                        label: "", // The name to display in the header
                        sortType: false,
                        editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
                        cell: Backbone.View.extend({
                            tagName : "td",
                            class: "table",
                            render : function(){
                                this.model.on('change:percent', _.bind(function(model){
                                    var value = model.get('percent').toString() + '%';
                                    $(this.$el.find('.progress-bar')[0])
                                    .css('width', value)
                                    .html(value);
                                }, this));
                                this.$el.html(`
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: ${this.model.get('percent')}%" >${this.model.get('percent')}</div>
                                </div>`);
                                return this;
                            },
                        })
                    }
                ],
                collection : this.uploadCollection
            });

            this.$el.append(this.uploadGrid.render().el);
            this.uploadGrid.header.remove();
            this.$el.css('display','NONE');
        },

        updateUploadStatus: function(fileDetails) {
            var uploadFileDetails = this.uploadCollection.get({id: fileDetails.id});
            if(uploadFileDetails) {
                if(fileDetails.percent === 101) {
                    this.uploadCollection.remove(uploadFileDetails);
                } else {
                    uploadFileDetails.set('percent', fileDetails.percent);
                }
            } else {
                this.uploadCollection.add(fileDetails);
            }

            if(this.uploadCollection.size() == 0) {
                this.$el.css('display','NONE');
            } else {
                this.$el.css('display','');
            }
        }
    })
});