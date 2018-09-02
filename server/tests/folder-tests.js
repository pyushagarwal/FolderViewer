const app = require('../server');
const chai = require('chai');
const mocha = require('mocha');
const expect = require('chai').expect;
chai.use(require('chai-http'))

var agent = chai.request.agent(app);

describe('Folders API', function(){

    this.timeout(1000); 
    var randomString = (Math.ceil(Math.random()*1000000)).toString(); 
    
    var userOne = {
        name: 'Test' + randomString,
        email: 'Test' + randomString + "@xyz.com",
        password: 'password'  
    }

    randomString = (Math.ceil(Math.random()*1000000)).toString(); 

    var userTwo = {
        name: 'Test' + randomString,
        email: 'Test' + randomString + "@xyz.com",
        password: 'password'  
    }

    var fileRoot = {};
    var fileChild = {};

    it('Create a user POST USER/', function(){
        return agent.post('/api/user')
        .send(userOne)
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.be.equal(userOne.name);
            userOne.id = res.body.id;
        }); 
    });

    it('Create another user POST USER/', function(){
        return agent.post('/api/user')
        .send(userTwo)
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.be.equal(userTwo.name);
            userTwo.id = res.body.id;
        }); 
    });

    it('Login the userA POST auth/login', function(){
        return agent.post('/api/auth/login')
        .send({
            email: userOne.email,
            password: userOne.password
        })
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
        });
    });

    it('Get the root folder GET file/', function(){
        return agent.get('/api/file')
        .send()
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.exist;
            expect(res.body.id).to.exist;
            expect(res.body.files).to.be.an('array');
            fileRoot.id = res.body.id;
        });
    });
    
    it('Should not delete without passing file Id DELETE file/', function(){
        return agent.delete('/api/file')
        .send()
        .then(function(res){
            expect(res).to.have.status(404);
        });
    });

    it('Should not delete a root folder DELETE file/', function(){
        return agent.delete('/api/file/' + fileRoot.id)
        .send()
        .then(function(res){
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.error).to.exist;
        });
    });

    it('Create a folder POST file/', function(){
        return agent.post('/api/file')
        .send({
            name: "test"
        })
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.exist;
            expect(res.body.id).to.exist;
            fileChild.id = res.body.id;
        });
    });

    it('Grant permission to folder POST file/', function(){
        return agent.put('/api/file/' + fileChild.id)
        .send({
            "shared_with": [{
                "action" : [ 
                        "READ"
                    ],
                 
                "user_id" : userTwo.id
            }]
        })
        .then(function(res){
            expect(res).to.have.status(204);
        });
    });

    it('Login the userTwo POST auth/login', function(){
        return agent.post('/api/auth/login')
        .send({
            email: userTwo.email,
            password: userTwo.password
        })
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
        });
    });


    it('Should delete folder created previously DELETE file/', function(){
        return agent.delete('/api/file/' + fileChild.id)
        .send()
        .then(function(res){
            expect(res).to.have.status(204);
        });
    });

    it('Delete the user DELETE USER/', function(){
        return agent.delete('/api/user/' + userTwo.id)
        .send()
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.deleted).to.be.true;
        });
    });

    it('Delete the user DELETE USER/', function(){
        return agent.delete('/api/user' + '/' + userOne.id)
        .send()
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.deleted).to.be.true;
        });
    });
});