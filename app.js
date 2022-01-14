var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var session = require('express-session')
var expressLayouts = require('express-ejs-layouts');

var passport = require("passport")
var LocalStrategy = require('passport-local').Strategy

var flash = require("express-flash")
var app = express()

//const http = require('http').Server(app);
//const io = require('socket.io')(http);

// configuring the env vars file
require('dotenv').config()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(expressLayouts)
app.set("layout", "layouts/root")
app.set("layout extractScripts", true)

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))

app.session_middleware = session({ secret: '123456789' })
app.use(app.session_middleware)

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use(require("./server/router"))

passport.use(new LocalStrategy(
  async function (username, password, done) {
    // return done(null, { username: username, password: password, level: 0 })  //comment for db
    const user = await global.db.get_user(username)
    if (user && await global.db.verify_password(user.password, password)) {
      return done(null, user)
    } else {
      return done(null, false, { message: 'Incorrect username or password.' })
    }
  }
))

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  done(null, user)
})

module.exports = app
