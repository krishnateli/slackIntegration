var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// require('dotenv').config();

var port = process.env.PORT || 3000;


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


http.listen(port, function () {
  console.log('listening on *:' + port);
});

// This is verification post call for slack
var bodyParser = require('body-parser');
app.use(bodyParser.json({ type: 'application/json' }));
app.post('/post', (request, response) => {
  const postBody = request.body;
  console.log("request data", postBody);
  if (postBody.event.subtype) {
    // event.text
    postBody.class = "sent-msg";
    io.emit('chat message sent', postBody);
  } else {
    postBody.class = "rec-msg";
    io.emit('chat message recieved', postBody);
  }
  response.json(postBody.challenge);
});


// Slack client code
const { WebClient } = require('@slack/client');

const token = process.env.TOKEN;
// Create a new instance of the WebClient class with the token stored in your environment variable
const web = new WebClient(token);



io.on('connection', function (socket) {
  socket.on('get token', function () {
    io.emit('token', token);
  });

  socket.on('initial data', function () {

  web.conversations.list()
    .then((resp) => {
      io.emit('conversations list', resp);
    })
    .catch((error) => {
      if (error.code === ErrorCode.PlatformError) {
        console.log('Message error!', error);
      } else {
        console.log('error!', error);
      }
    });

  web.users.list()
    .then((resp) => {
      io.emit('users list', resp);
    })
    .catch((error) => {
      if (error.code === ErrorCode.PlatformError) {
        console.log('Message error!', error);
      } else {
        console.log('error!', error);
      }
    });
  });

  socket.on('send to channel', function (msg, mTo) {
    //  Change the as_user = false to send message as authed user 
    web.chat.postMessage({ channel: mTo, text: msg, as_user: false, username: "ASR", parse: 'full' })
      .then((resp) => {
        console.log("Message sent")
        // io.emit('chat message sent', msg, mTo); 
      })
      .catch((error) => {
        if (error.code === ErrorCode.PlatformError) {
          console.log('Message error!', error);
        } else {
          console.log('error!', error);
        }
      })
  });
  socket.on('send to user', function (msg, mTo) {
    //  Change the as_user = false to send message as authed user 
    web.conversations.open({ users: mTo, parse: 'full' })
      .then((resp) => {
        console.log("Got Channel")
        web.chat.postMessage({ channel: resp.channel.id, text: msg, as_user: false, username: "ASR", parse: 'full' })
          .then((resp) => {
            console.log("Message sent")
            // io.emit('chat message sent', msg, mTo); 
          })
          .catch((error) => {
            if (error.code === ErrorCode.PlatformError) {
              console.log('Message error!', error);
            } else {
              console.log('error!', error);
            }
          })
      })
      .catch((error) => {
        if (error.code === ErrorCode.PlatformError) {
          console.log('Message error!', error);
        } else {
          console.log('error!', error);
        }
      })
  });

  // socket.on('chat message sentreply', function (msg, mTo, ts) {
  //   //  Change the as_user = false to send message as authed user 
  //   web.chat.postMessage({ channel: mTo, text: msg, as_user: false, username: "ASR", thread_ts: ts, parse: 'full' })
  //     .then((resp) => { 
  //       console.log("Message sent")
  //       // io.emit('chat message sent', msg, mTo); 
  //     })
  //     .catch((error) => {
  //       if (error.code === ErrorCode.PlatformError) {
  //         console.log('Message error!', error);
  //       } else {
  //         console.log('error!', error);
  //       }
  //     })
  // });

});
