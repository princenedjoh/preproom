import mongoose from "mongoose"

const coursesSchema = new mongoose.Schema(
    {
        "courseName": String,
        "programID" : String
    }
)


export default mongoose.model('coursesSchema', coursesSchema)