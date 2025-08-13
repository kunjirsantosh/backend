import mongoose, { isValidObjectId } from "mongoose"
import { Videos } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const sortDirection = sortType.toLowerCase() === "asc" ? 1 : -1

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                [sortBy]: sortDirection
            }
        },
        {
            $project: {
                likeCount: 1,
                owner: 1,
                views: 1,
                videoFile: 1,
                createdAt: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                isPublished: 1
            }
        }
    ]
    const videoAggregrate = Videos.aggregate(pipeline);

    const options = {
        page: Number(page),
        limit: Number(limit),
        pagination: true
    }

    const videos = Videos.aggregatePaginate(videoAggregrate, options);

    if (!videos) {
        throw new ApiError(500, "Something went wrong with getting all videos")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,
                {
                    videos
                },
                "Videos fetched successfully"
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if( !title || !description){
        throw new ApiError(400, "Title and description is required ")
    }

    const userId = req.user._id;
    if( !videoLocalPath || !videoThumbnailLocalPath){
        throw new ApiError(400, "Video and thumbnail is required ")
    }
    console.log(req);
  //  const videoLocalPath = req.files?.videoFile[0]?.path
    const videoThumbnailLocalPath =  req.files?.thumbnail[0]?.path
    if( !videoLocalPath || !videoThumbnailLocalPath){
        throw new ApiError(400, "Video and thumbnail is required ")
    }

    const videofile  = await uploadOnCloudinary(videoLocalPath);
    const thumbnail  = await uploadOnCloudinary(videoThumbnailLocalPath);

    if( !video || !videoThumbnail){
        throw new ApiError(500, "Something went wrong with uploading the video and thumbnail ")
    }

    const createdVideo = Videos.create(
        {
            title,
            description,
            videofile: videofile.url,
            thumbnail: thumbnail.url,
            owner: userId,
            duration: video.duration
        }
    )

    if( !createdVideo){
        throw new ApiError(500, "Something went wrong with creating the video ")
    }

    return  res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video created successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}