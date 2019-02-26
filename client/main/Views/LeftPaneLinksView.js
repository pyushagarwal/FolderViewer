define(['backbone',
    '../languageConstants.js',
], 
function(Backbone, languageConstants){
    return Backbone.View.extend({
        el: "#left-pane",
        
        initialize: function() {
            this.render();
        },
        events:{
            'click a[data-action=get_home]': 'getHome',
            'click a[data-action=get_shared]': 'getShared'
        },

        getShared: function(e) {
            e.preventDefault();
            router.navigate('shared', {trigger: true});
        },

        getHome: function(e) {
            e.preventDefault();
            router.navigate('', {trigger: true});
        },

        render: function(){
            var element = $('<a class="list-group-item list-group-item-action" href="#"></a>');
            element.attr('data-action', 'get_home').html(languageConstants.MY_FOLDERS);
            this.$el.find('ul').append(element);
            element = element.clone();
            element.attr('data-action', 'get_shared').html(languageConstants.SHARED);
            this.$el.find('ul').append(element);
        }
    })
});