const app = require('express')()
const Boom = require('boom')
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http').Server(app)
const io = require('socket.io')(http)

const PORT = 3000

app.use(cors())
app.use(bodyParser.json())

let members = []

// default namespace, only one chat namespace needed
io.on('connection', function(socket){
  console.info('a user connected', socket.id)
  members.push(socket.id)
  io.emit('active connections', members)

  socket.on('disconnect', function(){
    console.info('user disconnected', this.id)
    members = members.filter(member => member !== this.id)
    io.emit('active connections', members)
  })


})

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500).send(new Boom(err).output)
})

http.listen(PORT, console.log(`listening on port ${PORT}`))
