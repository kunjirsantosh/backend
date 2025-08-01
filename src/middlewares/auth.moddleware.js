import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt  from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req, _, next) => {
   try {
     const token = req.cookie?.accessToken |req.header("Authorization")?.replace("Bearer ", "");
     if(!token){
         throw new ApiError(401, "Unauthorise access");
     }
 
     const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
 
     const user = await User.find(decodedToken._id).select("-password -refreshToken");
 
     if(!user){
         throw new ApiError(401, "Invalid Access Token")
     }
 
     req.user = user;
     next();
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
   }
})