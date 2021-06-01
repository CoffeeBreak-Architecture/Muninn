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

const con = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

// Initialize the database table with the query defined above.
function initalizeDatabase () {
    console.log(createTableQuery)
    try{
        con.query(createTableQuery)
        console.log("Table created")
    }
    catch(err){
        console.log(err)
    }
    
}

app.get("/", (req, res) => {
    res.send("");
})

// Get a particular user through the ID
app.get('/users/user/:userId', function (req, res) {
    let userId = req.params.userId;
    con.query('SELECT * FROM users WHERE id = ?', [userId], (error, result, fields) => {
        if (error) {
            res.status(500).send(error)
        }else{
            if (result.length != 1) {
                res.status(404).send('No user found with ID ' + userId)
            }else{
                res.send(result[0])
            }
        }
    })
})

// Get ALL THE USERS
app.get('/users', function (req, res) {
    con.query('SELECT * FROM users', (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.send(result)
        }
    })
})

// Post a new user
app.post('/users', function (req, res) {

    let id = uuid()
    let room = req.body.roomId
    let nickname = req.body.nickname
    let x = 100
    let y = 100
    let hasAudio = false
    let hasVideo = false

    if (room == undefined || nickname == undefined) {
        throw 'Body must contain both a roomId and nickname value.'
    }

    con.query("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", [id, room, nickname, x, y, hasAudio, hasVideo], (error, result, fields) => {
        if (error) {
            res.status(500).send(error)
        }else{
            user = {id: id, roomId: room, nickname: nickname, x: x, y: x, hasAudio: hasAudio, hasVideo: hasVideo}
            res.status(201).send(user)
        }
    })
})

// Patch the users room.
app.patch('/users/:userId/room', function (req, res) {

    let userId = req.params.userId;
    let roomId = req.body.roomId;

    con.query('UPDATE users SET roomId = ? WHERE id = ?', [roomId, userId], (error, result, fields) => {
        if (error) {
            res.status(500).send(error)
        }else{
            res.sendStatus(200)
        }
    })
})

// Patch the users nickname
app.patch('/users/nickname', function (req, res) {

    let userId = req.body.clientId;
    let nickname = req.body.nickname

    con.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname, userId], (error, result, fields) => {
        if (error) {
            res.status(500).send(error)
        }else{
            res.sendStatus(200)
        }
    })
})

// Patch the users position
app.patch('/users/position', function (req, res) {

    let userId = req.body.clientId;
    let x = req.body.x
    let y = req.body.y

    con.query('UPDATE users SET x = ?, y = ? WHERE id = ?', [x, y, userId], (error, result, fields) => {
        if (error) {
            res.status(500).send(error)
        }else{
            res.sendStatus(200)
        }
    })
})

// Patch the users state
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

// Delete a particular user by ID
app.delete('/users/user/:userId', function (req, res) {
    let userId = req.params.userId;
    con.query('DELETE FROM users WHERE id = ?', [userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else{
            res.sendStatus(200)
        }
    })
})

// Get the members of a particular room.
// This would, in a domain context, make more sense in the room repository, however as users are the ones who contain the room ID, it needs to be here.
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

// Fetch all users nearby to a user and within a threshold defined in the http body.
// This is only a POST due to issues with the deployment. Should be a GET.
app.post('/users/nearby', function (req, res) {
    let userId = req.body.userId;
    let threshold = req.body.threshold

    // Select the user requested to find nearby from.
    con.query('SELECT * FROM users WHERE id = ?', [userId], (error, result, fields) => {
        if (error) {
            res.send(error, 500)
        }else {
            if (result.length == 1) {
            
                const user = result[0]
                const roomId = user.roomId
                const nearby = []
    
                // Select all OTHER users from the same room as the first selected user.
                con.query('SELECT * FROM users WHERE roomId = ? AND NOT id = ?', [roomId, userId], (error, result, fields) => {
                    if (error) {
                        res.send(error, 500)
                    }else{
                        result.forEach(x => {

                            let ox = x.x
                            let oy = x.y

                            // Calculate square distance and insure that it is within the square of the threshold.
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
    initalizeDatabase()
})