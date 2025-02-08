const Database = require('better-sqlite3')
const db = new Database('wat.db')

// Create tables if they don't exist
db.exec(require('fs').readFileSync('./schema.sql', 'utf8'))

// Prepare statements
const stmts = {
  getUser: db.prepare('SELECT * FROM users WHERE name = ?'),
  createUser: db.prepare('INSERT INTO users (name, password) VALUES (?, ?)'),
  updateUser: db.prepare(`
    UPDATE users 
    SET position_x = ?, position_y = ?, position_z = ?,
        rotation_x = ?, rotation_y = ?, rotation_z = ?,
        color = ?
    WHERE name = ?
  `),
  addMessage: db.prepare(`
    INSERT INTO messages (text, poster, position_x, position_y, position_z, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getMessages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 100')
}

const allPlayers = {}

module.exports = function(io) {
  const watio = io.of('/wat')

  watio.on('connection', socket => {
    console.log('User connected')

    socket.on('try to login', maybe => {
      const user = stmts.getUser.get(maybe.name)
      
      if (user) {
        if (maybe.password === user.password) {
          const userObj = {
            name: user.name,
            position: {
              x: user.position_x,
              y: user.position_y,
              z: user.position_z
            },
            rotation: {
              x: user.rotation_x,
              y: user.rotation_y,
              z: user.rotation_z
            },
            color: user.color
          }
          
          socket.emit('successful login', allPlayers, userObj)
          allPlayers[maybe.name] = userObj
          socket.name = maybe.name
          socket.broadcast.emit('new player', userObj)
        } else {
          socket.emit('not a valid password')
        }
      } else {
        try {
          stmts.createUser.run(maybe.name, maybe.password)
          const newUser = {
            name: maybe.name,
            position: {x: 0, y: 2000, z: 0},
            rotation: {x: 0, y: 0, z: 0},
            color: '0xffffff'
          }
          socket.emit('successful login', allPlayers, newUser)
          allPlayers[maybe.name] = newUser
          socket.name = maybe.name
          socket.broadcast.emit('new player', newUser)
        } catch (err) {
          console.error('Error creating user:', err)
          socket.emit('not a valid password')
        }
      }
    })

    socket.on('disconnect', () => {
      if (socket.playerData) {
        try {
          stmts.updateUser.run(
            socket.playerData.position.x,
            socket.playerData.position.y,
            socket.playerData.position.z,
            socket.playerData.rotation.x,
            socket.playerData.rotation.y,
            socket.playerData.rotation.z,
            socket.playerData.color,
            socket.playerData.name
          )
          delete allPlayers[socket.name]
          socket.broadcast.emit('kill player', socket.name)
        } catch (err) {
          console.error('Error updating user:', err)
        }
      }
    })

    socket.on('look at me', client => {
      allPlayers[client.name] = client
      socket.playerData = client
      watio.emit('a player changed', client)
    })

    socket.on('a new yell', msg => {
      watio.emit('a new yell', msg)
    })

    socket.on('a new post', msg => {
      try {
        stmts.addMessage.run(
          msg.text,
          msg.poster,
          msg.position.x,
          msg.position.y,
          msg.position.z,
          msg.color
        )
        watio.emit('a new post', msg)
      } catch (err) {
        console.error('Error saving message:', err)
      }
    })

    socket.on('gimme all the posts', () => {
      try {
        const messages = stmts.getMessages.all().map(row => ({
          text: row.text,
          poster: row.poster,
          position: {
            x: row.position_x,
            y: row.position_y,
            z: row.position_z
          },
          color: row.color
        }))
        socket.emit('here are all the posts', messages)
      } catch (err) {
        console.error('Error fetching messages:', err)
      }
    })
  })
}