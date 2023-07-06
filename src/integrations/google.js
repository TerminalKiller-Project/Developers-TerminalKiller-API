require("dotenv").config()
const express = require('express')
const router = express.Router()
const passport = require("passport");
const userSchema = require("../models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { 
  CLIENT_URL_LALOFREAK, 
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET, 
  API_URL 
} = require("../config/config");


router.use(express.json())
router.use(express.urlencoded({ extended: true }));

passport.use('google',
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${API_URL}/auth/google/callback`,   
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
  successRedirect: '/gwerh/auth/google/login/success',
  failureRedirect: '/gwerh/auth/google/login/failure'
}))

router.get('/login/success', async(req,res) => {
  const user = req.session.passport.user
      
  const accessToken = user.accessToken;
  const existingUser = await userSchema.findOne({ email: user.email });

  if (existingUser) {
    existingUser.accessToken = accessToken;
    await existingUser.save();
    return res.redirect(`${CLIENT_URL_LALOFREAK}/#/auth/auth?token=${accessToken}`)
  }
  const userData = {
    alias: user.name,
    email: user.email,
    method: 'google',
    isVerified: true,
    token: user.accessToken,
    googlePic: user.photo,
  }

  const newUser = new userSchema(userData);
  await newUser.save()
  return res.redirect(`${CLIENT_URL_LALOFREAK}/#/auth/auth?token=${accessToken}`)
})


router.get('/login/failure', async(req,res) => {
  res.redirect(`${CLIENT_URL_LALOFREAK}`)
})

router.get('/logout', (req,res)=>{
  req.logout((err)=>{
    if(err) return;
    res.redirect('/')
  })
})

module.exports = router