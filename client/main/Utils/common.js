define([], function(req, res){
    
    createUrl = function(oldUrl, toBeAppended){
        
        if(oldUrl.lastIndexOf('/') == oldUrl.length - 1){
            oldUrl = oldUrl.substr(0, oldUrl.length);
        }  
        if(toBeAppended){
            return oldUrl + "/" + toBeAppended;
        }else{
            return oldUrl;
        }
    }

    return {
        createUrl : createUrl
    }

});
