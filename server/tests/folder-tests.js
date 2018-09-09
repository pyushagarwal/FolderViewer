const app = require('../server');
const chai = require('chai');
const mocha = require('mocha');
const expect = require('chai').expect;
var errorMessage = require('../errorMessage');
chai.use(require('chai-http'))

const winston = require('winston');
var logger = winston.loggers.get('main');
logger.remove(winston.transports.Console);

var agent = chai.request.agent(app);

describe('Folders API', function(){

    this.timeout(4000); 
    
    var users = [1,2,3,4,5].map(function(){
        var randomString = (Math.ceil(Math.random()*1000000)).toString(); 
        return {
            name: 'Test' + randomString,
            email: 'Test' + randomString + "@xyz.com",
            password: 'password',
            files : [{ 
                    name: 'TestFolder1' + randomString 
                },{ 
                    name: 'TestFolder2' + randomString 
                }, { 
                    name: 'TestFolder3' + randomString 
                },{ 
                    name: 'TestFolder4' + randomString 
                }, { 
                    name: 'TestFolder5' + randomString 
                }
            ],
            rootFileId: ''
        };
    });

    var randomString = (Math.ceil(Math.random()*1000000)).toString();

    users.forEach(function(user, pos){
        it(`Create ${pos} user POST USER/`, function(){
            return agent.post('/api/user')
            .send(user)
            .then(function(res){
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.name).to.be.equal(user.name);
                users[pos].id = res.body.id;
            }); 
        });
    });

    it('Login the first user. POST auth/login', function(){
        return agent.post('/api/auth/login')
        .send({
            email: users[0].email,
            password: users[0].password
        })
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
        });
    });

    it('Should get the details of the root folder. GET file/', function(){
        return agent.get('/api/file')
        .send()
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.exist;
            expect(res.body.id).to.exist;
            expect(res.body.files).to.be.an('array');
            users[0].rootFileId = res.body.id;
        });
    });
    
    it('Should not delete without passing file Id as path param. DELETE file/', function(){
        return agent.delete('/api/file')
        .send()
        .then(function(res){
            expect(res).to.have.status(404);
        });
    });

    it('Should not delete a root folder. DELETE file/', function(){
        return agent.delete('/api/file/' + users[0].rootFileId)
        .send()
        .then(function(res){
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.exist;
        });
    });

    it(`Create a folder within root directory for user 0 POST file/`, function(){
        return agent.post('/api/file')
        .send({
            name: users[0].files[0].name
        })
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.exist;
            expect(res.body.id).to.exist;
            users[0].files[0].id = res.body.id;
        });
    });

    
    it('Should get "file already exists error" if you try to create a file with a name which already exists. POST file/', function(){
        return agent.post('/api/file')
        .send({
            name: users[0].files[0].name
        })
        .then(function(res){
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.equal(errorMessage.FILE_NAME_ALREAY_EXISTS);
        });
    });

    it('Create another file inside root directory when parent_id is not supplied. POST file/', function(){
        return agent.post('/api/file')
        .send({
            name: users[0].files[1].name
        })
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.exist;
            expect(res.body.id).to.exist;
            users[0].files[1].id = res.body.id;
        });
    });

    it('Rename previously created file. POST file/', function(){
        var newName = users[0].files[1].name + 'renamed';
        users[0].files[1].name = newName;

        return agent.put('/api/file/' + users[0].files[1].id)
        .send({
            name: newName
        })
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.true;
        });
    });

    it('Should rename previously created file with a space separated name. POST file/', function(){ 
        var newName = users[0].files[1].name + ' ' + 'again';
        users[0].files[1].name = newName;

        return agent.put('/api/file/' + users[0].files[1].id)
        .send({
            name: newName
        })
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.true;
        });
    });

    it('Should throw error while renaming, when a file with the new name already exists. POST file/', function(){
        return agent.put('/api/file/' + users[0].files[0].id)
        .send({
            name:  users[0].files[1].name
        })
        .then(function(res){
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.be.equal(errorMessage.FILE_NAME_ALREAY_EXISTS);
        });
    });

    it('Should throw error while renaming the root folder. POST file/', function(){
        return agent.put('/api/file/' + users[0].rootFileId)
        .send({
            name:  'random_name'
        })
        .then(function(res){
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.be.equal(errorMessage.ROOT_DIR_CANNOT_BE_RENAMED);
        });
    });


    describe('File Permission related', function(){
       
        it('User 0 should grant permission on file A to , POST file/', function(){
            return agent.put('/api/file/' + users[0].files[0].id)
            .send({
                "shared_with": [{
                    "action" : [ 
                            "READ"
                        ],
                     
                    "user_id" : users[1].id
                }, {
                    "action" : [ 
                            "WRITE",
                        ],
                     
                    "user_id" : users[2].id
                }, {
                    "action" : [ 
                            "DELETE",
                        ], 
                    "user_id" : users[3].id
                }
            ]
            })
            .then(function(res){
                expect(res).to.have.status(204);
            });
        });

        it('User 0 should grant permission on file B to user 4, POST file/', function(){
            return agent.put('/api/file/' + users[0].files[1].id)
            .send({
                "shared_with": [{
                    "action" : [ 
                            "GRANT",
                        ], 
                    "user_id" : users[4].id
                }
            ]
            })
            .then(function(res){
                expect(res).to.have.status(204);
            });
        });

        describe('User 1 with READ permission on file A', function(){
            
            it('Should login the users[1] POST auth/login', function(){
                return agent.post('/api/auth/login')
                .send({
                    email: users[1].email,
                    password: users[1].password
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                });
            });
            it('Should be able to read. GET file/', function(){
                return agent.get('/api/file/' + users[0].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                    expect(res.body.files).to.be.an('array');
                });
            });

            it('Should not be able to add a file. POST file/', function(){
                return agent.post('/api/file')
                .send({
                    parent_id: users[0].files[0].id,
                    name: "test2"
                })
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });

            it('Should not be able to delete. DELETE file/', function(){
                return agent.delete('/api/file/' + users[0].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });

            it('Should not be able to grant permission. PUT file/', function(){
                return agent.put('/api/file/' + users[0].files[0].id)
                .send({
                    shared_with:[{
                        "action" : [ 
                            "READ"
                        ],
                        "user_id" : users[1].id
                    }]
                })
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });

            it('Should not be able to rename folder. PUT file/', function(){
                return agent.put('/api/file/' + users[0].files[0].id)
                .send({
                    "name" : "newName"
                })
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });
        });
        
        describe('User 2 with WRITE permission on file A', function(){
            
            it('Should login the users[2] POST auth/login', function(){
                return agent.post('/api/auth/login')
                .send({
                    email: users[2].email,
                    password: users[2].password
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                });
            });
            it('Should be able to read. GET file/', function(){
                return agent.get('/api/file/' + users[0].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                    expect(res.body.files).to.be.an('array');
                });
            });

            it('Should be able to add a file. POST file/', function(){
                return agent.post('/api/file/')
                .send({
                    parent_id: users[0].files[0].id,
                    name: "child_" + users[2].name
                })
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                });
            });

            /*Does not work on windows*/
            it('Should be able to rename folder. PUT file/', function(){
                users[0].files[0].name =  users[0].files[0].name + 'renamed';

                return agent.put('/api/file/' + users[0].files[0].id)
                .send({
                    "name" : users[0].files[0].name
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.success).to.be.true;
                });
            });

            it('Should not be able to delete. DELETE file/', function(){
                return agent.delete('/api/file/' + users[0].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });

            it('Should not be able to grant permission. PUT file/', function(){
                return agent.put('/api/file/' + users[0].files[0].id)
                .send({
                    shared_with:[{
                        "action" : [ 
                            "READ"
                        ],
                        "user_id" : users[1].id
                    }]
                })
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });
        });

        describe('User 3 with DELETE permission on file A', function(){
            
            it('Should login the users[3] POST auth/login', function(){
                return agent.post('/api/auth/login')
                .send({
                    email: users[3].email,
                    password: users[3].password
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                });
            });
            it('Should be able to read. GET file/', function(){
                return agent.get('/api/file/' + users[0].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                    expect(res.body.files).to.be.an('array');
                });
            });

            /*Does not work on windows*/
            it('Should be able to add a file. POST file/', function(){
                return agent.post('/api/file/')
                .send({
                    parent_id: users[0].files[0].id,
                    name: "child_" + users[3].name
                })
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                });
            });

            /*Does not work on windows*/
            it('Should be able to rename folder. PUT file/', function(){
                users[0].files[0].name =  users[0].files[0].name + 'renamed';

                return agent.put('/api/file/' + users[0].files[0].id)
                .send({
                    "name" : users[0].files[0].name
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.success).to.be.true;
                });
            });

            it('Should be able to delete. DELETE file/', function(){
                return agent.delete('/api/file/' + users[0].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(204);
                });
            });

            it('Should not be able to grant permission. PUT file/', function(){
                return agent.put('/api/file/' + users[0].files[0].id)
                .send({
                    shared_with:[{
                        "action" : [ 
                            "READ"
                        ],
                        "user_id" : users[1].id
                    }]
                })
                .then(function(res){
                    expect(res).to.have.status(403);
                });
            });
        });

        describe('User 4 with GRANT permission on file B', function(){
            
            it('Should login the users[4] POST auth/login', function(){
                return agent.post('/api/auth/login')
                .send({
                    email: users[4].email,
                    password: users[4].password
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                });
            });
            it('Should be able to read. GET file/', function(){
                return agent.get('/api/file/' + users[0].files[1].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                    expect(res.body.files).to.be.an('array');
                });
            });

            /*Does not work on windows*/
            it('Should be able to add a file. POST file/', function(){
                return agent.post('/api/file/')
                .send({
                    parent_id: users[0].files[1].id,
                    name: "child_" + users[4].name
                })
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.name).to.exist;
                    expect(res.body.id).to.exist;
                    users[0].files[1].files = [{
                        id: res.body.id,
                        name: res.body.name
                    }]
                });
            });

            /*Does not work on windows*/
            it('Should be able to rename folder. PUT file/', function(){
                users[0].files[1].name =  users[0].files[1].name + 'renamed';

                return agent.put('/api/file/' + users[0].files[1].id)
                .send({
                    "name" : users[0].files[1].name
                })
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.success).to.be.true;
                });
            });

            it('Should be able to delete. DELETE file/', function(){
                return agent.delete('/api/file/' +  users[0].files[1].files[0].id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(204);
                });
            });

            it('Should be able to grant permission. PUT file/', function(){
                return agent.put('/api/file/' + users[0].files[1].id)
                .send({
                    shared_with:[{
                        "action" : [ 
                            "WRITE"
                        ],
                        "user_id" : users[1].id
                    }, {
                        "action" : [ 
                            "READ"
                        ],
                        "user_id" : users[2].id
                    }]
                })
                .then(function(res){
                    expect(res).to.have.status(204);
                });
            });

    
            describe('User 1 with permission upgraded to WRITE permission on file B', function(){
                
                it('Should login the users[1] POST auth/login', function(){
                    return agent.post('/api/auth/login')
                    .send({
                        email: users[1].email,
                        password: users[1].password
                    })
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                    });
                });
                it('Should be able to read. GET file/', function(){
                    return agent.get('/api/file/' + users[0].files[1].id)
                    .send()
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                        expect(res.body.name).to.exist;
                        expect(res.body.id).to.exist;
                        expect(res.body.files).to.be.an('array');
                    });
                });
    
                it('Should be able to add a file. POST file/', function(){
                    var randomString = (Math.ceil(Math.random()*1000000)).toString();
                    return agent.post('/api/file/')
                    .send({
                        parent_id: users[0].files[1].id,
                        name: "child_" + randomString
                    })
                    .then(function(res){
                        expect(res).to.have.status(201);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                        expect(res.body.name).to.exist;
                        expect(res.body.id).to.exist;
                    });
                });
    
                /*Does not work on windows*/
                it('Should be able to rename folder. PUT file/', function(){
                    users[0].files[1].name = users[0].files[1].name + 'renamed';
    
                    return agent.put('/api/file/' + users[0].files[1].id)
                    .send({
                        "name" : users[0].files[1].name
                    })
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                        expect(res.body.success).to.be.true;
                    });
                });
    
                it('Should not be able to delete. DELETE file/', function(){
                    return agent.delete('/api/file/' + users[0].files[1].id)
                    .send()
                    .then(function(res){
                        expect(res).to.have.status(403);
                    });
                });
    
                it('Should not be able to grant permission. PUT file/', function(){
                    return agent.put('/api/file/' + users[0].files[1].id)
                    .send({
                        shared_with:[{
                            "action" : [ 
                                "READ"
                            ],
                            "user_id" : users[1].id
                        }]
                    })
                    .then(function(res){
                        expect(res).to.have.status(403);
                    });
                });
            });
            
            describe('User 2 with permission downgraded to READ on file B', function(){
            
                it('Should login the users[1] POST auth/login', function(){
                    return agent.post('/api/auth/login')
                    .send({
                        email: users[2].email,
                        password: users[2].password
                    })
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                    });
                });
                it('Should be able to read. GET file/', function(){
                    return agent.get('/api/file/' +  users[0].files[1].id)
                    .send()
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('object');
                        expect(res.body.name).to.exist;
                        expect(res.body.id).to.exist;
                        expect(res.body.files).to.be.an('array');
                    });
                });
    
                it('Should not be able to add a file. POST file/', function(){
                    var randomString = (Math.ceil(Math.random()*1000000)).toString();
                    return agent.post('/api/file/')
                    .send({
                        parent_id:  users[0].files[1].id,
                        name: randomString
                    })
                    .then(function(res){
                        expect(res).to.have.status(403);
                    });
                });
    
                it('Should not be able to delete. DELETE file/', function(){
                    return agent.delete('/api/file/' +  users[0].files[1].id)
                    .send()
                    .then(function(res){
                        expect(res).to.have.status(403);
                    });
                });
    
                it('Should not be able to grant permission. PUT file/', function(){
                    return agent.put('/api/file/' +  users[0].files[1].id)
                    .send({
                        shared_with:[{
                            "action" : [ 
                                "READ"
                            ],
                            "user_id" : users[1].id
                        }]
                    })
                    .then(function(res){
                        expect(res).to.have.status(403);
                    });
                });
    
                it('Should not be able to rename folder. PUT file/', function(){
                    return agent.put('/api/file/' + users[0].files[1].id)
                    .send({
                        "name" : "newName"
                    })
                    .then(function(res){
                        expect(res).to.have.status(403);
                    });
                });
            });
            
        });


        // it('User  with READ permission on a file should not be able to delete. DELETE file/', function(){
        //     return agent.delete('/api/file/' + users[0].files[0].id)
        //     .send()
        //     .then(function(res){
        //         expect(res).to.have.status(403);
        //     });
        // });
        
        // it('Should not be able to delete. DELETE file/', function(){
        //     return agent.delete('/api/file/' + users[0].files[0].id)
        //     .send()
        //     .then(function(res){
        //         expect(res).to.have.status(403);
        //     });
        // });
        
        // it('Should not be able to delete. DELETE file/', function(){
        //     return agent.delete('/api/file/' + users[0].files[0].id)
        //     .send()
        //     .then(function(res){
        //         expect(res).to.have.status(403);
        //     });
        // });
    

    //     it('User with READ permission on a file should be able to READ file GET file/', function(){
    //         return agent.get('/api/file/' + users[0].files[0].id)
    //         .send()
    //         .then(function(res){
    //             expect(res).to.have.status(200);
    //         });
    //     });
    
    //     it('Login the users[2] POST auth/login', function(){
    //         return agent.post('/api/auth/login')
    //         .send({
    //             email: users[2].email,
    //             password: users[2].password
    //         })
    //         .then(function(res){
    //             expect(res).to.have.status(200);
    //             expect(res).to.be.json;
    //             expect(res.body).to.be.an('object');
    //         });
    //     });
        
    //     it('Should be able to read the file shared by first user GET file/', function(){
    //         return agent.get('/api/file/' + users[0].files[0].id)
    //         .send()
    //         .then(function(res){
    //             expect(res).to.have.status(200);
    //         });
    //     });
    
    //     it('Thrid user grants permission  on folder to second user - WRITE permission POST file/', function(){
    //         return agent.put('/api/file/' + users[0].files[0].id)
    //         .send({
    //             "shared_with": [{
    //                 "action" : [ 
    //                         "READ"
    //                     ],
                     
    //                 "user_id" : users[1].id
    //             }]
    //         })
    //         .then(function(res){
    //             expect(res).to.have.status(204);
    //         });
    //     });
    });

    describe('Should delete users ', function(){
        users.forEach(function(user, pos){
            it(`Delete the ${pos} user DELETE USER/`, function(){
                return agent.delete('/api/user/' + user.id)
                .send()
                .then(function(res){
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body.deleted).to.be.true;
                });
            });
        });
    });

});