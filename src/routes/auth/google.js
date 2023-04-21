require("dotenv").config()
const express = require('express')
const router = express.Router()
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/auth/google/callback`,   
      scope: [
        'email',
        'profile', 
        'https://www.googleapis.com/auth/userinfo.email', 
        'https://www.googleapis.com/auth/userinfo.profile', 
        'https://www.googleapis.com/auth/plus.me'
      ],
      accessType: 'offline'
    }, function(accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
      try {
        const userData = {
          name: profile.displayName,
          email: profile.emails[0].value,
          photo: profile.photos[0].value,
          accessToken: accessToken,
        }
        console.log(userData)
        return done(null, userData)
        } catch (err) {
          return done(err)
        }
      })
    }
  )
);

passport.serializeUser((user, done)=>{
    done(null, user)
});

passport.deserializeUser((user, done)=>{
    done(null, user)
});

router.get('/', passport.authenticate('google', {state: '200'}))

router.get('/callback', passport.authenticate('google', {
  successRedirect: `${process.env.CLIENT_URL}`,
  failureRedirect: '/auth/login/failure'
}))

router.get('/login/success', (req,res) => {
    console.log('success!')
    res.redirect('http://developers.terminalkiller.site/lalofreak/cv')
})

router.get('/logout', (req,res)=>{
  req.logout((err)=>{
    if(err) return;
    res.redirect('/')
  })
})

module.exports = router