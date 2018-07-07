requirejs.config({
    shim:{
        'backbone':{
            deps:['underscore', 'jquery'],
            exports:['Backbone']
        },
        'underscore':{
            deps:[],
            exports:['_','Underscore']
        },
        'jquery':{
            deps:[],
            exports:['Jquery','$']
        },
        'bbgrid': {
            deps: ['backbone'],
            exports: 'bbGrid'
        },
    },
    paths:{
        'backbone':'Vendor/Scripts/backbone',
        'jquery':'Vendor/Scripts/jquery',
        'underscore':'Vendor/Scripts/underscore',
        "text":"Vendor/Scripts/text",
        "bbgrid":"Vendor/Scripts/bbGrid"
    }
});

require(['backbone','underscore',"jquery"], function(Backbone, _, $){
    event_bus = _({}).extend(Backbone.Events);
    window.event_bus = event_bus;
    window.$ = $;
});

require(['backbone','./Router/router', './Views/App'],
    function(Backbone, Router, App){
        var app = new App();
        window.app = app;
        window.router = new Router();
        Backbone.history.start();
        
});