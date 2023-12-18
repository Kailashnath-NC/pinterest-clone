const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  imageUrl: String,
  imageCaption: String,
  imageDescription: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
});

const postModel = model("post", postSchema);

module.exports = postModel;
