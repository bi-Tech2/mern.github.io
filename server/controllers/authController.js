import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const { JsonWebTokenError } = jwt;
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js"

export const register = async (req, res)=>{

    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.json({success: false, message: "Missing Details"})
    }

    try{

        const existingUser = await userModel.findOne({email})

        if(existingUser){
            return res.json({success: false, massage: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({name, email, password: hashedPassword});
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRETS, {expiresIn: "7d"});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to BiTech",
            text: `Welcome to BiTech website, your account has been created with email id: ${email}`
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true})

    }catch (error){
        res.json({success: false, message: error.message})
    }
}  

export const login = async (req, res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: "email and password required"})
    }

    try {

        const user = await userModel.findOne({email});

        if(!user){
            return res.json({success: false, message: "Invalid email"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.json({success: false, message: "Invalid password"})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRETS, {expiresIn: "7d"});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "prodecution",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({success: true})

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}
export const logout = async(req, res) =>{
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "prodecution",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        return res.json({success: true, message: "Logged out"})
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const sendVerifyOtp = async (req, res)=>{
    try {

         const {userId} = req.body

         const user = await userModel.findById(userId);

         if(user.isAccountVerified){
            return res.json({succes: false, message: "Account Already verified"})
         }

        const otp = String(Math.floor(100000 + math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60* 60 * 1000

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account verification OTP",
            text: `your OTP is: ${otp}, Verify your account using this OTP`
        }
        await transporter.sendMail(mailOption);

        res.json({success: true, message: "Verification OTP sent to Email"});

    } catch(error) {
        res.json({success: false, message: error.message});
    }
}

export const verifyEmail = async(req, res) =>{
    const {userId, otp} = req.body;

    if(!userId || !otp){
        return res.json({success: false, message: "Missing details"});
    }
    try {
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        if(user.verifyOtp === "" || user.verifyOtp !== otp){
            return res.json({success: false, message: "Invalid OTP"});
        }

        if(user.verifyOtpExpireaAt < Date.now){
            return res.json({success: false, message: "OTP Expired"});
        }

        user.isAccountVerified = true;
        user.verifiyOtp = ""
        user.verifiyOtpExpireAt = 0;

        await user.save();
        return res.json({success: true, message: "Email verified SUccessfully"})
        
    } catch (error) {
        return res.json({success: false, message: error.message});
        
    }
}