const express = require("express")
const router = express.Router()

const UserController = require("./controllers/usersController")
const VideosController = require("./controllers/videosController")

router.get("/", VideosController.allVideos)

router.get("/search", VideosController.search_video)

router.get("/sign_in", UserController.sign_in_page)
router.get("/sign_up", UserController.sign_up_page)

router.post("/sign_up", UserController.sign_up)
router.post("/sign_in", UserController.sign_in)

router.get("/sign_out", UserController.sign_out)

router.get("/add_video", VideosController.add_video_page)
router.post("/add_video", VideosController.add_video)

router.get("/user/:username", VideosController.user_videos)

router.get("/video/:video_id", VideosController.noteVideo)

router.get("/edit_video/:video_id", VideosController.edit_video)
router.post("/edit_video", VideosController.edit_video_post)

router.post("/delete_video", VideosController.delete_video)
router.post("/unshare", VideosController.unshare)

module.exports = router
