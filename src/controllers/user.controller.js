import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Somthing went wrong while creating refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user deatils from frontend
    // validation  - not empty
    // check user already exist email
    // cehck of images avatar
    // upload them to cloudinary avatar
    // create your objet - create entry in db
    // remove password and refresh token from reponse
    // check for user creation
    // return response

    const { fullName, email, username, password } = req.body;

    //    if(fullName === ''){
    //         throw ApiError(400, "Fullname is required")
    //    }
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with username or email alredy exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLoalPath = req.files?.coverImage[0]?.path;
    let coverImageLoalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLoalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLoalPath);

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User regiser successfully!")
    )
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and refresh token

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid user credentials ")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password, -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User loggedin user successful")
        )
});

const logoutUser = asyncHandler(async (req, res) => {   
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    }, {
        new: true
    })
     const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user successfully logout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefereshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefereshToken) {
        throw new ApiError(401, "Unauthorised user")
    }
    try {

        const decodedToken = jwt.verify(incomingRefereshToken, process.env.REFERESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefereshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token expired or used");
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req?.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changes successfully"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json( new ApiResponse(200, req.user, "Current user fetched successfully!"))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (fullName || email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar ")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-passowrd");
    return res
        .status(200)
        .json( new ApiResponse(200, user, "Avatar image updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage ")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-passowrd")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))
});

const getUserChannelprofile = asyncHandler(async (req, res)=>{
    const { username } = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscriberTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedCount: {
                    $size:"$subscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if:{$id:[req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName:1,
                username: 1,
                subscriberCount:1,
                channelsSubscribedCount: 1,
                isSubscribed:1,
                avatar:1,
                email: 1,
                coverImage: 1
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User fetched successfully")
    )
}); 

const getUserWatchedHistory = asyncHandler(async(req, res)=>{
    const user = User.aggregate([
        {
            $watch:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from:"vedios",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline: [
                                {
                                $project: {
                                    fullName:1,
                                    username,
                                    avatar:1
                                }
                                }
                            ]

                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json( 
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history feched successfully"
        )
    )
});

export {
    loginUser,
    registerUser,
    updateUserCoverImage,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateUserAvatar,
    getCurrentUser,
    updateAccountDetails,
    getUserChannelprofile,
    getUserWatchedHistory
}