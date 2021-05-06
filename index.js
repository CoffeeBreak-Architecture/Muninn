const express = require('express')
const app = express()
const mysql = require('mysql2')
const port = 3010
const {v4:uuid} = require('uuid');

app.use(express.json());

const createTableQuery = 'CREATE TABLE IF NOT EXISTS users ('
 + 'id CHAR(36) PRIMARY KEY,'
 + 'roomId CHAR(36),'
 + 'nickname VARCHAR(64),'
 + 'x SMALLINT,'
 + 'y SMALLINT,'
 + 'hasAudio BOOLEAN,'
 + 'hasVideo BOOLEAN'
 + ')'

const con = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})
con.connect(function(error) {
    if (error) {
       throw error
    } else initalizeDatabase()
})

function initalizeDatabase () {
    console.log(createTableQuery)
    con.query(createTableQuery, function(error, result, fields) {
        if (error) {
            console.error('Failed to initialize database.', error)
        }
        console.log('Succesfully initialized database!')
    })
}

app.get('/users/:userId', function (req, res) {
    let userId = req.params.userId;
    con.query('SELECT * FROM users WHERE id = ?', [userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            if (result.length != 1) {
                res.send('No user found with ID ' + userId, 404)
            }else{
                res.send(result[0])
            }
        }
    })
})

app.get('/users', function (req, res) {
    con.query('SELECT * FROM users', (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.send(result)
        }
    })
})

app.post('/users', function (req, res) {

    let id = uuid()
    let room = null
    let nickname = req.body.nickname
    let x = 100
    let y = 100
    let hasAudio = false
    let hasVideo = false

    con.query("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", [id, room, nickname, x, y, hasAudio, hasVideo], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            user = {id: id, roomId: room, nickname: nickname, x: x, y: x, hasAudio: hasAudio, hasVideo: hasVideo}
            res.send(user, 201)
        }
    })
})

app.patch('/users/:userId/room', function (req, res) {

    let userId = req.params.userId;
    let roomId = req.body.roomId;

    con.query('UPDATE users SET roomId = ? WHERE id = ?', [roomId, userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.sendStatus(200)
        }
    })
})

app.patch('/users/:userId/nickname', function (req, res) {

    let userId = req.params.userId;
    let nickname = req.body.nickname

    con.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname, userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.sendStatus(200)
        }
    })
})

app.patch('/users/:userId/position', function (req, res) {

    let userId = req.params.userId;
    let x = req.body.x
    let y = req.body.y

    con.query('UPDATE users SET x = ?, y = ? WHERE id = ?', [x, y, userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.sendStatus(200)
        }
    })
})

app.patch('/users/:userId/state', function (req, res) {

    let userId = req.params.userId;
    let hasAudio = req.body.hasAudio
    let hasVideo = req.body.hasVideo

    con.query('UPDATE users SET hasAudio = ?, hasVideo = ? WHERE id = ?', [hasAudio, hasVideo, userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.sendStatus(200)
        }
    })
})

app.delete('/users/:userId', function (req, res) {
    let userId = req.params.userId;
    con.query('DELETE FROM users WHERE id = ?', [userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.sendStatus(200)
        }
    })
})

app.get('/users/members/:roomId', function (req, res) {
    let roomId = req.params.roomId
    con.query('SELECT * FROM users WHERE roomId = ?', [roomId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.send(result)
        }
    })
})

app.get('/users/:userId/nearby/:threshold', function (req, res) {
    let userId = req.params.userId;
    let threshold = req.params.threshold
    con.query('SELECT * FROM users WHERE id = ?', [userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else {
            if (result.length == 1) {
            
                const user = result[0]
                const roomId = user.roomId
                const nearby = []
    
                con.query('SELECT * FROM users WHERE roomId = ? AND NOT id = ?', [roomId, userId], (error, result, fields) => {
                    if (error) {
                        res.send(error, 500)
                    }else{
                        result.forEach(x => {

                            let ox = x.x
                            let oy = x.y

                            let sqrDist = Math.pow(ox - user.x, 2) + Math.pow(oy - user.y, 2)
                            if (sqrDist < threshold * threshold) {
                                nearby.push({id: x.id, x: ox, y: oy, sqrDist: sqrDist})
                            }
                        })

                        res.send(nearby, 200)
                    }
                })
            }
        }
    })
})

app.listen(port, () => {
    console.log('User repository is listening at port: ' + port)
})