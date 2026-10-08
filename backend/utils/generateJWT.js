// this util is just for token generation ESM 
import jwt from "jsonwebtoken"

// our function expects the id, name, email and role -- role is reading from the token
// user is an object we are getting from  authController
const generateAccessToken=(user)=>{
    // this fucntion is for generting the jwt secret -- jwt has three parts header, payload, and signature
    const payload ={
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    // takes payload, secret and options 
    const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "15m"
        }
    )
    return token;
}


const generateRefreshToken=(user)=>{
    const payload ={
        id: user.id,
    }

    // takes payload, secret and options 
    const token = jwt.sign(
        payload, 
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN  || "7d"
        }
    )
    return token;

}


export {
    generateAccessToken,
    generateRefreshToken
};