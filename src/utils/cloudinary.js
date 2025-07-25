import {v2 as cloudinary} from "cloudinary"
import fs from "fs";


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been successfully upload
        console.log(response);
        return response;
    } catch(error){
        fs.unlinkSync(localFilePath)// remove the locally save temp file as the upload file failed
        return null;
    }
}

export {uploadOnCloudinary};
