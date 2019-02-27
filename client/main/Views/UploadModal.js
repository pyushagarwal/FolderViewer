define(['backbone',
    'backbone-modal',
    '../languageConstants.js',
    'text!Templates/UploadFileTemplate.html',
],
function(Backbone,
    BackboneModal,
    LanguageConstants,
    UploadFileTemplate){
        
    return Backbone.Modal.extend({
        template: _.template(UploadFileTemplate,{}),
        cancelEl: '.bbm-button',
        onRender: function() {
            
        },
        events: {
            'submit': 'uploadFile'
        },

        uploadFile: function(e) {
            e.preventDefault();
            var formData = new FormData();
            var parentFolderId = app.currentFolder._id;
            var browserFileObject = this.$el.find('#file_upload_form')[0][0].files[0];
            formData.append('fileName', browserFileObject);

            var fileDetails = {
                parentFolderId : parentFolderId,
                file_name: browserFileObject.name,
                id :  parentFolderId + browserFileObject.name,
                percent : 0
            }
            window.event_bus.trigger("uploadProgress", fileDetails);

            $.ajax({
                url: `/api/file/${parentFolderId}/upload`,
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                method: 'POST',
                type: 'POST',
                beforeSend: function(request) {
                    request.setRequestHeader("fileName", browserFileObject.name.toString());
                },
                xhr: function() {
                    var xhr = new window.XMLHttpRequest();
    
                    xhr.upload.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            percentComplete = parseInt(percentComplete * 100);
                            fileDetails.percent = percentComplete;
                            window.event_bus.trigger("uploadProgress", fileDetails);
                        }
                    }, false);
    
                    return xhr;
                },
                success: function(response){
                    fileDetails.percent = 101;
                    fileDetails.response = response;
                    window.event_bus.trigger("uploadProgress", fileDetails);
                },
                error: function(error) {
                    fileDetails.percent = 101;
                    fileDetails.error = error.responseJSON;
                    window.event_bus.trigger("uploadProgress", fileDetails);
                }
                
            });

            this.triggerCancel(); //close the modal
        }
    });
});