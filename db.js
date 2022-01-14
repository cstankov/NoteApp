const pg = require('pg')
const argon2 = require("argon2")

const config = {
  user: "noteapp",
  database: "noteapp",
  password: "noteapp",
  host: "localhost",
  port: 5432
}

const pool = new pg.Pool(config)

/* Structures:
  - user {
    id: int,
    username: string,
    password: string,
    level: int,
    created_at: date
  }
  - video {
    id: int,
    title: string,
    url: string,
    public: bool,
    user_id: int,
    created_at: date
  }
  - note {
    id: int,
    text: string,
    time: date,
    public: bool,
    user_id: int,
    video_id: int,
    created_at: date
  }
*/

module.exports = {
  pool: pool,
  async get_user(username) {
    return pool.query(
      "select * from users where username ilike $1",
      [username])
      .then(result => result.rows[0])
  },
  async get_user_by_id(user_id) {
    return pool.query(
      "select * from users where id = $1",
      [user_id])
      .then(result => result.rows[0])
  },
  async verify_password(hash, password) {
    return argon2.verify(hash, password)
  },
  async create_user(username, password) {
    username = username.toLowerCase()
    const hash = await argon2.hash(password)
    return pool.query(
      "insert into users(username, password) values($1, $2) returning *",
      [username, hash])
      .then(result => result.rows[0])
  },
  async delete_user(id) {
    return pool.query(
      "delete from users where id = $1",
      [id])
  },
  async get_video(id) {
    return pool.query(
      "select videos.*, users.username from videos left join users on users.id = videos.user_id where videos.id = $1",
      [id])
      .then(result => result.rows[0])
  },
  async get_videos(user) {
    return pool.query(
      "select * from videos where user_id = $1",
      [user.id])
      .then(result => result.rows)
  },
  async create_video(user, video) {
    return pool.query(
      "insert into videos(user_id, title, url, public, thumbnail) values($1, $2, $3, $4, $5) returning *",
      [user.id, video.title, video.url, video.public, video.thumbnail])
      .then(result => result.rows[0])
  },
  async delete_video(video) {
    return pool.query(
      "delete from videos where id = $1",
      [video.id])
  },
  async edit_video(video) {
    return pool.query(
      "update videos set title = $1, public = $2 where id = $3",
      [video.title, video.public, video.id])
  },
  async get_video_tags(video) {
    return pool.query("select tag_name from videos_tags where video_id = $1",
      [video.id])
      .then(result => result.rows)
  },
  async get_notes(video) {
    return pool.query(
      "select notes.*, users.username from notes left join users on users.id = notes.user_id where notes.video_id = $1 and public = true",
      [video.id])
      .then(result => result.rows)
  },
  async get_user_notes(video, user) {
    return pool.query(
      "select notes.*, users.username from notes left join users on users.id = notes.user_id where notes.video_id = $1 and notes.user_id = $2 and public = false",
      [video.id, user.id])
      .then(result => result.rows)
  },
  async create_note(user, video, note) {
    return pool.query(
      "insert into notes(user_id, video_id, text, time, public) values($1, $2, $3, $4, $5) returning *",
      [user.id, video.id, note.text, note.time, note.public])
      .then(result => result.rows[0])
  },
  async delete_note(note) {
    return pool.query(
      "delete from notes where id = $1",
      [note.id])
  },
  async edit_note(note) {
    return pool.query(
      "update notes set text = $1, time = $2 public = $3 where id = $4",
      [note.text, note.time, note.public, note.id])
  },
  async add_tag(tag) {
    return pool.query(
      "insert into tags(name) values($1) on conflict do nothing", [tag])
  },
  async tag(video, tag) {
    return pool.query(
      "insert into videos_tags(video_id, tag_name) values($1, $2)", [video.id, tag])
  },
  async get_videos_title(title) {
    return pool.query(
      "select videos.*, users.username from videos left join users on users.id = videos.user_id where videos.title ~ $1",
      [title])
      .then(result => result.rows)
  },
  async get_videos_tag(tag) {
    return pool.query(
      "select videos.*, users.username from videos left join users on users.id = videos.user_id where videos.id in (select video_id from videos_tags where tag_name ~ $1)",
      [tag])
      .then(result => result.rows)
  },
  async remove_tags(video) {
    return pool.query(
      "delete from videos_tags where video_id = $1",
      [video.id])
  },
  async shared_with(video) {
    return pool.query(
      "select * from users where users.id in (select user_id from video_share where video_id = $1)",
      [video.id])
      .then(result => result.rows)
  },
  async share_with(video, user) {
    return pool.query(
      "insert into video_share(video_id, user_id) values($1, $2)",
      [video.id, user.id])
  },
  async unshare(video, user_id) {
    return pool.query(
      "delete from video_share where video_id = $1 and user_id = $2",
      [video.id, user_id])
  },
  async get_shared_videos(user) {
    return pool.query(
      "select * from videos where videos.id in (select video_id from video_share where user_id = $1)",
      [user.id])
      .then(result => result.rows)
  },
  async unsubscribe(user1, user2) {
    return pool.query(
      "delete from user_subscribe where user_id = $1 and other_user_id = $2",
      [user1.id, user2.id])
  },
  async subscribe_to(user1, user2) {
    return pool.query(
      "insert into user_subscribe(user_id, other_user_id) values($1, $2)",
      [user1.id, user2.id])
  },
  async is_subscribed(user1, user2) {
    return pool.query(
      "select * from user_subscribe where user_id = $1 and other_user_id = $2",
      [user1, user2])
      .then(result => result.rows.length > 0)
  },
  async get_subscriptions_videos(user) {
    return pool.query(
      "select * from videos where videos.user_id in (select other_user_id from user_subscribe where user_id = $1)",
      [user.id])
      .then(result => result.rows)
  }
}
