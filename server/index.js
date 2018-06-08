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

const { getConvoId } = require('../utils/utils.js')

const PORT = 3000

app.use(cors())
app.use(bodyParser.json())

let members = []

const disconnect = (id, store) => {
  console.info('user disconnected', id)
  store = store.filter(item => item !== id)
  io.emit('active connections', store)
  // delete active conversations
  let convoKeys = cache.keys().filter(key => !key.includes(id))
  convoKeys.forEach(key => cache.delete(key))
  console.log('remaining users', cache.keys())
}

const sendMsg = (data, socket) => {
  console.info('message received', data)
  const dataKey = getConvoId(data.userId, data.id)

  let storedValue = cache.get(dataKey)
  if (!storedValue) { // init conversation
    const val = {
      [data.userId]: [],
      [data.id]: []
    }
    cache.put(dataKey, val)
    storedValue = val
  }

  //store msg
  const newMsg = Object.assign(
    {},
    storedValue,
    { [data.userId]: storedValue[data.userId].concat(data.msg) }
  )
  cache.put(dataKey, newMsg)
  socket.to(data.id).emit('message::to', data.msg)
}

const connect = (socket) => {
  console.info('a user connected', socket.id)
  members.push(socket.id)

  // broadcast active members and emit back your userId
  io.emit('active connections', members)
  socket.emit('userId', socket.id)

  // socket events
  socket.on('disconnect', () => disconnect(id, members))
  socket.on('private_msg', (data) => sendMsg(data, socket))
}

// default namespace, only one chat namespace needed
io.on('connection', connect)

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
