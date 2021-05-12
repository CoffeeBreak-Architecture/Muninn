const expect = require("chai").expect
const axios = require('axios')

describe("Repository tests", function() {
    
    const url = "http://localhost:3010"

    describe("User CRUD", function() {

        afterEach('Clean up', async function () {
            let users = await axios.get(url + '/users')
            users.data.forEach (async x => {
                await axios.delete(url + '/users/user/' + x.id)
            })
        })

        it("POST /users", async function() {
            let response = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            expect(response.data.roomId).to.equal('someId')
            expect(response.data.nickname).to.equal('someNickname')
            expect(response.status).to.equal(201)

            return Promise.resolve()
        })

        it('GET /users', async function () {
            let response = await axios.get(url + '/users')
            expect(response.data.length >= 1)
            expect(response.status).to.equal(200)
            return Promise.resolve()
        })

        it("GET /users/user/:id", async function() {
            let post = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            let id = post.data.id

            let response = await axios.get(url + '/users/user/' + id)
            expect(response.data.roomId).to.equal('someId')
            expect(response.data.nickname).to.equal('someNickname')
            expect(response.status).to.equal(200)
            return Promise.resolve()
        })

        it("GET /users/user/:id where ID does not exist", async function () {
            try {
                await axios.get(url + '/users/user/nobody')
            } catch (error) {
                expect(error.response.status).to.equal(404)
            }
            return Promise.resolve()
        })

        it("PATCH /users/nickname", async function () {
            let post = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            let id = post.data.id

            expect(post.data.nickname).to.equal('someNickname')
            await axios.patch(url + '/users/nickname', {clientId: id, nickname: 'someNewNickname'})
            let patched = await axios.get(url + '/users/user/' + id)
            expect(patched.data.nickname).to.equal('someNewNickname')
            return Promise.resolve()
        })

        it("PATCH /users/:id/room", async function () {
            let post = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            let id = post.data.id

            expect(post.data.roomId).to.equal('someId')
            await axios.patch(url + '/users/' + id + '/room', {roomId: 'someNewId'})
            let patched = await axios.get(url + '/users/user/' + id)

            expect(patched.data.roomId).to.equal('someNewId')
            return Promise.resolve()
        })

        it("PATCH /users/position", async function () {
            let post = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            let id = post.data.id

            expect(post.data.x).to.equal(100)
            expect(post.data.y).to.equal(100)

            await axios.patch(url + '/users/position', {clientId: id, x: 150, y: 150})
            let patched = await axios.get(url + '/users/user/' + id)

            expect(patched.data.x).to.equal(150)
            expect(patched.data.y).to.equal(150)
            return Promise.resolve()
        })

        it("PATCH /users/:id/state", async function () {
            let post = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            let id = post.data.id

            expect(post.data.hasAudio).to.equal(false)
            expect(post.data.hasVideo).to.equal(false)

            await axios.patch(url + '/users/' + id + '/state', {hasAudio: true, hasVideo: true})
            let patched = await axios.get(url + '/users/user/' + id)
            
            expect(patched.data.hasAudio).to.equal(1)
            expect(patched.data.hasVideo).to.equal(1)
            return Promise.resolve()
        })

        it("DELETE /users/user/:id", async function () {
            let post = await axios.post(url + '/users', {roomId: 'someId', nickname: 'someNickname'})
            let id = post.data.id

            await axios.delete(url + '/users/user/' + id)

            try {
                await axios.get(url + '/users/user/' + id)
            } catch (error) {
                expect(error.response.status).to.equal(404)
            }

            return Promise.resolve()
        })

        it("GET /users/members/:roomId", async function () {
            await axios.post(url + '/users', {roomId: 'someId0', nickname: 'someNickname'})
            await axios.post(url + '/users', {roomId: 'someId0', nickname: 'someNickname'})
            await axios.post(url + '/users', {roomId: 'someId1', nickname: 'someNickname'})
            await axios.post(url + '/users', {roomId: 'someId1', nickname: 'someNickname'})
            await axios.post(url + '/users', {roomId: 'someId1', nickname: 'someNickname'})

            let members0 = await axios.get(url + '/users/members/' + 'someId0')
            let members1 = await axios.get(url + '/users/members/' + 'someId1')

            expect(members0.data.length == 2).to.be.true
            expect(members1.data.length == 3).to.be.true

            return Promise.resolve()
        })

        it("GET /users/nearby", async function () {
            await axios.post(url + '/users', {roomId: 'someId0', nickname: 'someNickname'})
            await axios.post(url + '/users', {roomId: 'someId0', nickname: 'someNickname'})

            let still = await axios.post(url + '/users', {roomId: 'someId1', nickname: 'someNickname'})
            let toMove0 = await axios.post(url + '/users', {roomId: 'someId1', nickname: 'someNickname'})
            let toMove1 = await axios.post(url + '/users', {roomId: 'someId1', nickname: 'someNickname'})

            await axios.patch(url + '/users/position', {clientId: toMove0.data.id, x: 1000, y: 1000})
            await axios.patch(url + '/users/position', {clientId: toMove1.data.id, x: 1000, y: 1000})

            let nearby0 = await axios.post(url + '/users/nearby', {userId: still.data.id, threshold: 200})
            let nearby1 = await axios.post(url + '/users/nearby', {userId: toMove1.data.id, threshold: 200})

            expect(nearby0.data.length == 0).to.be.true
            expect(nearby1.data.length == 1).to.be.true

            return Promise.resolve()
        })
    })
})