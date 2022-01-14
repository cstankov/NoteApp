const assert = require("assert")

describe("Test database", () => {
  global.db = require("../db.js")

  let user = null
  let user2 = null
  const username = "user" + Date.now()
  const username2 = "user2" + Date.now()
  const password = "password"

  const video_info = {
    title: "video",
    url: "url",
    public: false,
    thumbnail: "thumbnail"
  }

  before(async () => {
    await global.db.pool.connect()
      .then(client => {
        global.db.client = client
      })
  })

  after(async () => {
    await global.db.client.end()
  })

  it("Create user", async () => {
    user = await global.db.create_user(username, password)
  })

  it("Get user by username from db", async () => {
    assert.deepStrictEqual(await global.db.get_user(user.username), user)
  })

  it("Get user by id from db", async () => {
    assert.deepStrictEqual(await global.db.get_user_by_id(user.id), user)
  })

  it("Verify password", async () => {
    assert.strictEqual(await global.db.verify_password(user.password, password), true)
  })

  let video = null
  let video_with_username = null
  it("Create video", async () => {
    video = await global.db.create_video(user, video_info)
    video_with_username = Object.assign({ username: user.username }, video)

    assert.strictEqual(video.title, video_info.title)
    assert.strictEqual(video.url, video_info.url)
    assert.strictEqual(video.public, video_info.public)
    assert.strictEqual(video.thumbnail, video_info.thumbnail)
  })

  it("Get video", async () => {
    assert.deepStrictEqual(await global.db.get_video(video.id), video_with_username)
  })

  it("Get videos", async () => {
    assert.deepStrictEqual(await global.db.get_videos(user), [video])
  })

  it("Edit video", async () => {
    video_info.public = true
    video_info.title = "video2"
    video.public = video_info.public
    video.title = video_info.title
    video_with_username = Object.assign(video_with_username, video)
    await global.db.edit_video(video)
    assert.deepStrictEqual(await global.db.get_video(video.id), video_with_username)
  })

  let note = null
  it("Create note", async () => {
    const note_info = {
      text: "text",
      time: new Date().getSeconds(),
      public: true
    }
    note = await global.db.create_note(user, video, note_info)
    assert.strictEqual(note.text, note_info.text)
    assert.strictEqual(note.time, note_info.time)
    assert.strictEqual(note.public, note_info.public)
  })

  it("Get notes", async () => {
    const notes = await global.db.get_notes(video)
    const note_with_username = Object.assign({ username: username }, note)
    assert.deepStrictEqual(notes, [note_with_username])
  })

  it("Delete notes and then readd for further testing", async () => {
    await global.db.delete_note(note)
    var tempNote = await global.db.get_notes(video)
    assert.deepStrictEqual(tempNote, [])
  })

  const tag = "testing"

  it("Add tag to video", async () => {
    await global.db.add_tag(tag)
    await global.db.tag(video, tag)
    assert.deepStrictEqual(await global.db.get_videos_tag(tag), [video_with_username])
  })

  it("Remove tag", async () => {
    await global.db.remove_tags(video, tag)
    assert.deepStrictEqual(await global.db.get_videos_tag(tag), [])
  })

  it("Get video by title", async () => {
    assert.deepStrictEqual(await global.db.get_videos_title(video_info.title), [video_with_username])
  })

  it("Share", async () => {
    user2 = await global.db.create_user(username2, password)
    await global.db.share_with(video, user2)
    assert.deepStrictEqual(await global.db.get_shared_videos(user2), [video])
  })

  it("Unshare", async () => {
    await global.db.unshare(video, user2.id)
    assert.deepStrictEqual(await global.db.get_shared_videos(user2), [])
  })

  it("Subscribe to", async () => {
    await global.db.subscribe_to(user2, user)
    assert.strictEqual(await global.db.is_subscribed(user2.id, user.id), true)
  })

  it("Subscription videos", async () => {
    assert.deepStrictEqual(await global.db.get_subscriptions_videos(user2), [video])
  })

  it("Unsubscribe", async () => {
    await global.db.unsubscribe(user2, user)
    assert.strictEqual(await global.db.is_subscribed(user2.id, user.id), false)
  })

  it("Delete other user", async () => {
    await global.db.delete_user(user2.id)
    assert.strictEqual(await global.db.get_user_by_id(user2.id), undefined)
  })

  it("Delete video", async () => {
    await global.db.delete_video(video)
    assert.strictEqual(await global.db.get_video(video.id), undefined)
  })

  it("Delete user", async () => {
    await global.db.delete_user(user.id)
    assert.strictEqual(await global.db.get_user_by_id(user.id), undefined)
  })
})
