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
        backgrid: {
            deps: ['backbone', 'jquery', 'underscore'],
            exports: 'backGrid'
        },
        "backgrid-select-all":{
            deps: ['backbone'],
            export : ['BackgridSelectAll']
        }
    },
    paths:{
        'backbone':'Vendor/Scripts/backbone',
        'jquery':'Vendor/Scripts/jquery',
        'underscore':'Vendor/Scripts/underscore',
        "text":"Vendor/Scripts/text",
        "backgrid":"Vendor/Scripts/backgrid",
        "moment": "Vendor/Scripts/moment",
        "backgrid-select-all": "Vendor/Scripts/backgrid-select-all"
    }
});

require(['backbone','underscore',"jquery"], function(Backbone, _, $){
    event_bus = _({}).extend(Backbone.Events);
    window.event_bus = event_bus;
    window.$ = $;
    window._ = _;
});

require(['backbone','./Router/router', './Views/App'],
    function(Backbone, Router, App){
        var app = new App();
        window.app = app;
        window.router = new Router();
        Backbone.history.start();
        
});