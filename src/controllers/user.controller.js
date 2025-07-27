import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespose } from "../utils/ApiResponse.js";
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

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    });

    if(existedUser){
        throw new ApiError(409, "User with username or email alredy exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLoalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = uploadOnCloudinary(avatarLocalPath);
    const coverImage = uploadOnCloudinary(coverImageLoalPath);

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password, 
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiRespose(200, createdUser, "User regiser successfully!")
    )
    console.log(createdUser);

});

export { registerUser }