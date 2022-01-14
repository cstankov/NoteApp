const axios = require('axios');

const allVideos = async (req, res) => {
    const popular_videos = await getPopularVideosYT()
    let user_videos = []
    let shared_videos = []
    let subscribed_videos = []
    if (req.user) {
        user_videos.push(...await global.db.get_videos(req.user))
        shared_videos.push(...await global.db.get_shared_videos(req.user))
        subscribed_videos.push(...await global.db.get_subscriptions_videos(req.user))
    }

    subscribed_videos = await filter_videos(req, subscribed_videos)

    res.render('dashboard.ejs', {
        user: req.user,
        popular_videos: popular_videos.data.items,
        user_videos: user_videos,
        shared_videos: shared_videos,
        subscribed_videos: subscribed_videos,
    })
}

const noteVideo = async (req, res) => {
    const video = await global.db.get_video(req.params.video_id)
    if (!video) {
        res.redirect("/")
        return
    }

    if (!(video.public || (
        req.user && (
            video.user_id == req.user.id ||
            (await global.db.shared_with(video)).map(x => x.id).includes(req.user.id)
        )
    ))) {
        res.redirect("/")
        return
    }

    const tags = await global.db.get_video_tags(video)

    let is_subscribed = false
    if (req.user) {
        is_subscribed = await global.db.is_subscribed(req.user.id, video.user_id)
    }

    res.render("video.ejs", {
        user: req.user,
        video: video,
        tags: tags,
        is_subscribed: is_subscribed
    })
}

const getPopularVideosYT = () => {
    apiKey = process.env.YOUTUBE_API_KEY
    youTubeApi = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=CA&key=${apiKey}`

    return axios.get(youTubeApi)
}

const yt_playlist_re = /http(?:s|):\/\/(?:www.|)youtube.com\/playlist?.+?list=([^&]+)/
const yt_video_re = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/

async function getYTPlaylist(playlist, page = "") {
    const playlist_id = playlist.match(yt_playlist_re)[1]

    const key = process.env.YOUTUBE_API_KEY
    const ytapi = `https://www.googleapis.com/youtube/v3/playlistItems?part=id,snippet&playlistId=${playlist_id}&key=${key}&pageToken=${page}`

    const res = await axios.get(ytapi)
    if (!res.data.items) return []

    if (res.data.nextPageToken) {
        return [...res.data.items, ...await getYTPlaylist(playlist, res.data.nextPageToken)]
    } else {
        return res.data.items
    }
}

async function getYTVideo(url) {
    const match = url.match(yt_video_re)
    if (!match) {
        return null
    }

    const video_id = match[1]
    const key = process.env.YOUTUBE_API_KEY
    const ytapi = `https://www.googleapis.com/youtube/v3/videos?part=snippet,id&id=${video_id}&key=${key}`

    const res = await axios.get(ytapi)
    if (!res.data.items || res.data.items.length == 0) {
        return null
    }

    return res.data.items[0]
}

async function import_yt(req, res, tags) {
    const videos = await getYTPlaylist(req.body.url)
    if (videos.length == 0) {
        req.flash("error", "No videos found")
        res.redirect("/add_video")
    }

    for (const tag of tags) {
        await global.db.add_tag(tag)
    }

    for (const video of videos) {
        let thumbnail_url = ""
        if (video.snippet.thumbnails.standard) {
            thumbnail_url = video.snippet.thumbnails.standard.url
        } else {
            const thumb = Object.values(video.snippet.thumbnails)[0]
            if (thumb) {
                thumbnail_url = thumb.url
            }
        }

        const new_video = await global.db.create_video(req.user, {
            title: video.snippet.title,
            url: video.snippet.resourceId.videoId,
            public: req.body.public || false,
            thumbnail: thumbnail_url
        })

        for (const tag of tags) {
            await global.db.tag(new_video, tag)
        }
    }

    res.redirect("/")
}

async function add_video(req, res) {
    if (!req.user) {
        res.redirect("/sign_in")
        return
    }
    const video = req.body

    let tags = []

    if (Array.isArray(video.tags)) {
        tags = video.tags
    } else if (video.tags) {
        tags.push(video.tags)
    }

    tags = Array.from(new Set(tags))

    if (video.url.match(yt_playlist_re)) {
        import_yt(req, res, tags)
        return
    }

    const yt_video = await getYTVideo(video.url)

    if (!yt_video) {
        req.flash("error", "Invalid video")
        res.redirect("/add_video")
        return
    }

    for (const tag of tags) {
        await global.db.add_tag(tag)
    }

    let thumbnail_url = ""
    if (yt_video.snippet.thumbnails.standard) {
        thumbnail_url = yt_video.snippet.thumbnails.standard.url
    } else {
        const thumb = Object.values(yt_video.snippet.thumbnails)[0]
        if (thumb) {
            thumbnail_url = thumb.url
        }
    }

    const new_video = await global.db.create_video(req.user, {
        title: yt_video.snippet.title,
        url: yt_video.id,
        public: video.public || false,
        thumbnail: thumbnail_url
    })

    for (const tag of tags) {
        await global.db.tag(new_video, tag)
    }

    res.redirect(`/video/${new_video.id}`)
}

async function add_video_page(req, res) {
    if (req.user) {
        res.render("add_video", { user: req.user, flash_error: req.flash("error") })
    } else {
        res.redirect("/sign_in")
    }
}

async function filter_videos(req, videos) {
    const filtered = []

    for (const video of Object.values(videos)) {
        if (video.public ||
            (req.user && (
                video.user_id == req.user.id ||
                (await global.db.shared_with(video)).map(x => x.id).includes(req.user.id)
            ))) {
            filtered.push(video)
        } else if (req.user) {
            if ((await global.db.shared_with(video)).map(x => x.id).includes(req.user.id)) {
                filtered.push(video)
            }
        }
    }

    return filtered
}

async function search_video(req, res) {
    const results = await global.db.get_videos_title(req.query.query)
    results.push(...await global.db.get_videos_tag(req.query.query))

    const unique = {}
    results.forEach(result => {
        if (!(result.id in unique)) {
            unique[result.id] = result
        }
    })

    const videos = await filter_videos(req, unique)

    res.render("videos.ejs", {
        query: req.query.query,
        videos: videos
    })
}

async function user_videos(req, res) {
    const user = await global.db.get_user(req.params.username)
    if (!user) {
        res.render("user_videos.ejs", {
            query: `${req.params.username}'s Videos`,
            videos: [],
            can_upload: false
        })
        return
    }

    const videos = await global.db.get_videos(user)

    res.render("user_videos.ejs", {
        query: `${user.username}'s Videos`,
        videos: await filter_videos(req, videos),
        can_upload: req.user && req.user.id == user.id
    })
}

async function edit_video(req, res) {
    if (!req.user) {
        res.redirect("/sign_in")
        return
    }

    const video = await global.db.get_video(req.params.video_id)

    if (!video) {
        res.redirect("/")
        return
    }

    if (video.user_id != req.user.id) {
        res.redirect("/")
        return
    }

    const tags = await global.db.get_video_tags(video)

    const shared_with = await global.db.shared_with(video)

    res.render("edit_video.ejs", {
        video: video,
        tags: tags,
        shared_with: shared_with
    })
}

async function edit_video_post(req, res) {
    if (!req.user) {
        res.redirect("/sign_in")
        return
    }

    const video = await global.db.get_video(req.body.video_id)

    if (!video) {
        res.redirect("/")
        return
    }

    if (video.user_id != req.user.id) {
        res.redirect("/")
        return
    }

    if (req.body.title) {
        video.title = req.body.title
    }
    video.public = req.body.public || false

    await global.db.edit_video(video)

    let tags = []
    if (Array.isArray(req.body.tags)) {
        tags = req.body.tags
    } else if (req.body.tags) {
        tags.push(req.body.tags)
    }

    tags = Array.from(new Set(tags))

    await global.db.remove_tags(video)

    for (const tag of tags) {
        await global.db.add_tag(tag)
    }

    for (const tag of tags) {
        await global.db.tag(video, tag)
    }

    res.redirect(`/video/${video.id}`)
}

async function delete_video(req, res) {
    if (!req.user) {
        res.redirect("/sign_in")
        return
    }

    const video = await global.db.get_video(req.body.video_id)

    if (!video) {
        res.redirect("/")
        return
    }

    if (video.user_id != req.user.id) {
        res.redirect("/")
        return
    }

    await global.db.delete_video(video)

    res.redirect(`/user/${req.user.username}`)
}

async function unshare(req, res) {
    if (!req.user) {
        res.redirect("/sign_in")
        return
    }
    const video = await global.db.get_video(req.body.video_id)
    if (!video) {
        res.redirect("/")
        return
    }
    if (video.user_id != req.user.id) {
        res.redirect("/")
        return
    }

    await global.db.unshare(video, req.body.user_id)

    res.redirect(`/edit_video/${video.id}`)
}

module.exports = {
    allVideos,
    add_video,
    add_video_page,
    noteVideo,
    search_video,
    user_videos,
    edit_video,
    edit_video_post,
    delete_video,
    unshare
}
