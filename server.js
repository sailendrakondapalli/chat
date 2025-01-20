

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');

dotenv.config();

const app = express();
const port = 5000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Database connection
mongoose.connect(process.env.url)
  .then(() => console.log('yeah connected'))
  .catch((err) => console.error(err));

// Session store
const store = new MongoDBStore({
  uri: process.env.url,
  collection: 'sessions',
});

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Routes
app.get('/register', (req, res) => res.render('register'));

app.get('/login', (req, res) => res.render('login'));

app.get('/chat', checkAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.render('chat', {
      username: req.session.username,
      userId: req.session.userId,
      messages,
    });
  } catch (err) {
    console.error('Error loading chat:', err);
    res.status(500).send('Error loading chat');
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Error registering user:', err);
    res.redirect('/register');
  }
});

app.post('/user-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect('/register');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.redirect('/register');
    }

    req.session.isAuthenticated = true;
    req.session.userId = user._id;
    req.session.username = user.username;

    res.redirect('/chat');
  } catch (err) {
    console.error('Error logging in:', err);
    res.redirect('/login');
  }
});

// Create server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('message', async (data) => {
    try {
      if (!data.userId || !data.username || !data.message) {
        console.error('Invalid message payload');
        return;
      }

      // Save message to the database
      const newMessage = new Message({
        userId: data.userId,
        username: data.username,
        message: data.message,
      });
      await newMessage.save();

      // Broadcast the message to all connected clients
      io.emit('message', {
        username: data.username,
        message: data.message,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
