import  mongoose  from "mongoose";

const newUser = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Please enter your name"],
        maxLength:[30, "Name cannot exceed 30 character"],
        minLength: [4,"Name should have more than 4 character"],
    },
    email:{
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
    },
    password:{
        type: String,
        required: [true, "Please enter a password"]
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})


const User = mongoose.model("User", newUser)
export default User;
