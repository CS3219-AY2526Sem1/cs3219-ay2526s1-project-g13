import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    questionId: {
      type: String,
      default: null,
    },
    userIds: {
      type: [String],
      default: [],
      required: true,
    },
    programmingLanguage: {
      type: String,
      enum: ["cpp", "java", "javascript", "python"],
      default: "python",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.index({ roomId: 1, userIds: 1 });

roomSchema.statics.findRoomByRoomId = function (roomId) {
  return this.findOne({ roomId });
};

roomSchema.statics.findRoomsByUserId = function (userId) {
  return this.find({ userIds: userId });
};

roomSchema.methods.closeRoom = function () {
  this.isActive = false;
  this.closedAt = new Date();
  return this.save();
};

roomSchema.methods.setProgrammingLanguage = function (language) {
  if (!roomSchema.path("programmingLanguage").enumValues.includes(language)) {
    throw new Error(
      "Invalid programming language. Must be one of: " +
        roomSchema.path("programmingLanguage").enumValues.join(", "),
    );
  }
  this.programmingLanguage = language;
  return this.save();
};

const Room = mongoose.model("Room", roomSchema, "rooms");
export default Room;
