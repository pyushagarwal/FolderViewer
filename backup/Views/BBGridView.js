define(["bbgrid"], function(BBGrid){
    return BBGrid.View.extend({
        
        caption : "Folder Viewer",
        colModel: [
            {
                title: 'ID', 
                name: 'id',
                sorttype: 'number'
            },
            {
                title: 'Name',
                name: 'file_name',
                filter: true,
                filterType: 'input'},
            {
                title : 'Date Modified',
                name : 'mtime'}
        ],
        rows : 10,
        rowList : [10, 20, 50, 100]
    });
});