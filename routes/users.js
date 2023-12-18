const { connect, Schema, model } = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

connect("mongodb://127.0.0.1:27017/pinterest");

const userSchema = Schema({
  username: String,
  email: String,
  password: String,
  dob: String,
  profileImage: String,
  boards: {
    type: Array,
    default: [],
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

userSchema.plugin(passportLocalMongoose);

const userModel = model("user", userSchema);

module.exports = userModel;
