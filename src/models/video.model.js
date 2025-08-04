import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            require: true,
        },
        thumbnail: {
            type: String,
            require: true,
        },
        title: {
            type: String,
            require: true,
        },
        discription: {
            type: String,
            require: true,
        },
        duration: {
            type: Number, // Coudinary
            require: true,
            default:  0
        },
        isPublishd: {
            type: Boolean,
            default: true
        },
        owner: {
            type:Schema.Types.ObjectId,
            ref: "User"
        }
    },{timestamps: true});

mongoose.plugin(mongooseAggregatePaginate);

export const Videos = mongoose.model("Video", videoSchema) 