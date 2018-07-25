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
        "backbone-forms":{
            deps:['backbone'],
            exports:['BackboneForm']
        }
    },
    paths:{
        'backbone':'../Vendor/Scripts/backbone',
        'jquery':'../Vendor/Scripts/jquery',
        'underscore':'../Vendor/Scripts/underscore',
        "text":"../Vendor/Scripts/text",
        "backbone-forms": "../Vendor/Scripts/backbone-forms"
    }
});

require(['backbone','underscore',"jquery", './Views/LoginView'],
function(Backbone, _, $, LoginView){
    event_bus = _({}).extend(Backbone.Events);
    window._ = _;
    window.$ = $;
    var loginView = new LoginView();
    loginView.render();
    Backbone.history.start();
        
});