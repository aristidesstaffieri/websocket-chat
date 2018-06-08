'user strict'

const app = require('express')()
const Boom = require('boom')
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http').Server(app)
const io = require('socket.io')(http)

/*
* Storing conversations by ID, [to::from]: {userId: [], userId: []}
*/
const cache = require('memory-cache')
cache.put('members', []) //init members

const { getConvoId } = require('../utils/utils.js')

const PORT = 3000

app.use(cors())
app.use(bodyParser.json())

const disconnect = (id, store) => {
  console.info('user disconnected', id)
  const connections = store.get('members')
  const activeConnections = connections.filter(item => item !== id)
  store.put('members', activeConnections)
  io.emit('active connections', activeConnections)
  // delete active conversations
  let convoKeys = store.keys().filter(key => !key.includes(id))
  convoKeys.forEach(key => store.del(key))
}

const sendMsg = (data, socket, store) => {
  console.info('message received', data)
  const dataKey = getConvoId(data.userId, data.id)

  let storedValue = store.get(dataKey)
  if (!storedValue) { // init conversation
    const val = {
      [data.userId]: [],
      [data.id]: []
    }
    store.put(dataKey, val)
    storedValue = val
  }

  //store msg
  const newMsg = Object.assign(
    {},
    storedValue,
    { [data.userId]: storedValue[data.userId].concat(data.msg) }
  )
  store.put(dataKey, newMsg)
  socket.to(data.id).emit('message::to', data.msg)
}

const connect = (socket, store) => {
  const connections = store.get('members') || []
  console.info('a user connected', socket.id)
  store.put('members', connections.concat(socket.id))

  // broadcast active members and emit back your userId
  console.log(store.get('members'))
  io.emit('active connections', store.get('members'))
  socket.emit('userId', socket.id)

  // socket events
  socket.on('disconnect', function() {
    disconnect(this.id, store)
  })
  socket.on('private_msg', (data) => sendMsg(data, socket, store))
}

// default namespace, only one chat namespace needed
io.on('connection', (socket) => connect(socket, cache))

// rest routes
app.get('/conversations/:id', (req, res, next) => {
  res.send(cache.get(req.params.id) || {})
  return next()
})

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500).send(new Boom(err).output)
})

http.listen(PORT, console.log(`listening on port ${PORT}`))
