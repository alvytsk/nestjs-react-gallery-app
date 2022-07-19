db.createUser(
  {
    user: "gallery",
    pwd: "gallery",
    roles: [
      {
        role: "readWrite",
        db: "gallery"
      }
    ]
  }
)