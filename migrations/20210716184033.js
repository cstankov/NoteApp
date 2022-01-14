exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    username: {
      type: "varchar(1000)",
      notNull: true,
      unique: true
    },
    password: { type: "varchar(1000)", notNull: true },
    level: { type: "int" },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  })

  pgm.createTable("tags", {
    name: {
      primaryKey: true,
      type: "varchar(1000)"
    }
  })

  pgm.createTable("videos", {
    id: "id",
    title: { type: "varchar(1000)", notNull: true },
    url: { type: "varchar(1000)", notNull: true },
    public: { type: "boolean", default: false },
    thumbnail: { type: "varchar(1000)" },
    user_id: {
      type: "int",
      notNull: true,
      references: "\"users\"",
      onDelete: "cascade",
    },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  })

  pgm.createTable("videos_tags", {
    video_id: {
      type: "int",
      notNull: true,
      references: "\"videos\"",
      onDelete: "cascade",
    },
    tag_name: {
      type: "varchar(1000)",
      notNull: true,
      references: "\"tags\"",
      onDelete: "cascade",
    }
  },
    {
      constraints: {
        primaryKey: ["video_id", "tag_name"]
      }
    })

  pgm.createTable("notes", {
    id: "id",
    user_id: {
      type: "int",
      notNull: true,
      references: "\"users\"",
      onDelete: "cascade",
    },
    video_id: {
      type: "int",
      notNull: true,
      references: "\"videos\"",
      onDelete: "cascade",
    },
    text: { type: "text", notNull: true },
    time: {
      type: "int",
      notNull: true,
    },
    public: { type: "boolean", default: false },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    }
  })

  pgm.createTable("user_subscribe", {
    user_id: {
      type: "int",
      notNull: true,
      references: "\"users\"",
      onDelete: "cascade",
    },
    other_user_id: {
      type: "int",
      notNull: true,
      references: "\"users\"",
      onDelete: "cascade",
    }
  })

  pgm.createTable("video_share", {
    video_id: {
      type: "int",
      notNull: true,
      references: "\"videos\"",
      onDelete: "cascade",
    },
    user_id: {
      type: "int",
      notNull: true,
      references: "\"users\"",
      onDelete: "cascade",
    }
  })

  pgm.addConstraint("video_share", "video_share_video_id_user_id", {
    unique: ["video_id", "user_id"]
  })

  pgm.addConstraint("user_subscribe", "user_subscribe_user_id_other_user_id", {
    unique: ["user_id", "other_user_id"]
  })

  pgm.createIndex("videos", "user_id")
}
