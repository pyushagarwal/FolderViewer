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
        },
        'backbone-modal' : {
            deps: ['backbone', 'underscore', 'jquery'],
            export : ['backbone-modal']            
        }
    },
    paths:{
        'backbone':'../Vendor/Scripts/backbone',
        'jquery':'../Vendor/Scripts/jquery',
        'underscore':'../Vendor/Scripts/underscore',
        "text":"../Vendor/Scripts/text",
        "backgrid":"../Vendor/Scripts/backgrid",
        "moment": "../Vendor/Scripts/moment",
        "backgrid-select-all": "../Vendor/Scripts/backgrid-select-all",
        'backbone-modal': "../Vendor/Scripts/backbone.modal",
    }
});

require(['backbone','underscore',"jquery"], function(Backbone, _, $){
    event_bus = _({}).extend(Backbone.Events);
    window.event_bus = event_bus;
    window.$ = $;
    window._ = _;

    Backbone.syncModified = function(type, url, data) {
        return new Promise(function(resolve, reject){
            $.ajax({
                url: url,
                contentType: 'application/json',
                type: type,
                data: JSON.stringify(data)
            }).then(function(response){
                resolve(response);
            }).catch(function(error){
                if(error.status == 401) {
                    alert('You have been logged out. Sign in again');
                    window.location = window.location.toString().split('/').slice(0,3).join('/') + "/login";
                }
                else {
                    reject(error);
                }
            });
        })
    };
    
    require(['backbone','./Router/router', './Views/App'],
        function(Backbone, Router, App){
            var app = new App();
            window.app = app;
            window.router = new Router();
            Backbone.history.start();
    });
});
