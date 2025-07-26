const asyncHandler = (RequestHandler) => {
   return (req, res, next) => {
        Promise.resolve(RequestHandler(req, res, next)).catch((err)=>next(err))
    }
}

export { asyncHandler };

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {} 
// const asyncHandler = (func) => async () => {} 

// const asyncHandler = (func) => async (requestAnimationFrame, resizeBy, next) => {
//     try {
//         await func(req, resizeBy, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
