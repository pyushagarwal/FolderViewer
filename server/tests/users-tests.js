const app = require('../server');
const chai = require('chai');
const mocha = require('mocha');
const expect = require('chai').expect;
chai.use(require('chai-http'))

var agent = chai.request.agent(app);

describe.skip('Users API', function(){

    after(function(){
        // request.server.close();
    });

    this.timeout(1000); 
    var randomString = (Math.ceil(Math.random()*1000000)).toString(); 
    var user = {
        name: 'Test' + randomString,
        email: 'Test' + randomString + "@xyz.com",
        password: 'password'  
    }

    it('Create a user POST USER/', function(){
        return agent.post('/api/user')
        .send(user)
        .then(function(res){
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.be.equal(user.name);
            user.id = res.body.id;
        }); 
    });

    it('Get the user GET USER/', function(){
        return agent.get('/api/user' + '/' + user.id)
        .send()
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.name).to.be.equal(user.name);
            expect(res.body.id).to.be.equal(user.id);
        });
    });

    it('Login the user POST auth/login', function(){
        return agent.post('/api/auth/login')
        .send({
            email: user.email,
            password: user.password
        })
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
        });
    });

    it('Delete the user DELETE USER/', function(){
        return agent.delete('/api/user' + '/' + user.id)
        .send()
        .then(function(res){
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('object');
            expect(res.body.deleted).to.be.true;
        });
    });
});