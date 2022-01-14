const passport = require("passport")

module.exports = {
  async sign_out(req, res) {
    req.session.destroy(function (err) {
      err && console.log('sign_out error: ', err)
      res.redirect('sign_in');
    });
  },
  async sign_in_page(req, res) {
    res.render("user/sign_in.ejs", { flash: req.flash("msg"), flash_error: req.flash("error") })
  },
  async sign_up_page(req, res) {
    res.render("user/sign_up.ejs", { flash_error: req.flash("error") })
  },
  async sign_up(req, res) {
    const { username, password } = req.body
    try {
      await global.db.create_user(username, password)
    } catch (err) {
      if (err["code"] == "23505") {
        req.flash("error", "Username already exists")
      } else {
        req.flash("error", err["detail"])
      }
      res.redirect("/sign_up")
      return
    }
    req.flash("msg", "Sign up successful. Sign in with your new credentials.")
    res.redirect("/sign_in")
  },
  async sign_in(req, res) {
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/sign_in",
      failureFlash: true
    })(req, res)
  }
}
