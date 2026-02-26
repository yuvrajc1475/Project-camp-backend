import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";

import{emailverificationMailgenContent, forgotPasswordMailgenContent, sendEmail} from "../utils/mail.js"
import crypto from "crypto";
import jwt from "jsonwebtoken"
import { access } from "fs";



const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access token")
    }
}
    


const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body
    
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409,"User with email or username already exists",[])
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified:false
    })


    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    
    user.emailVerificationExpiry = tokenExpiry
    user.emailVerificationToken = hashedToken
    
    await user.save({ validateBeforeSave: false })
    
    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailverificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        }
    )

    const registeredUser = await User.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );
    if (!registeredUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: registeredUser },
                "user registered successfully and verification has been sent on your email"
            )
        )


})


const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "user doenot exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken:""
      }
    }, 
    {
      new: true
    },

  )
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
    new ApiResponse(200,{},"User logged out")
  )
   
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      req.user,
      "Current user fetched successfully"
    )
  )
})

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params
  
  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing")
  }
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() }
  })

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;


  user.isEmailVerified = true
  await user.save({ validateBeforeSave: false })
  
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          isEmailVerified: true
        },
        "Email is verified"
      )
    )



});


const resendEmailverification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404,"User doesnot exist")
  }
  if (user.isEmailVerified) {
    throw new ApiError(409,"Email is already verified")
  }
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationExpiry = tokenExpiry;
  user.emailVerificationToken = hashedToken;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailverificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Mail has been sent to your email ID"
      )
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  
  if (!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorised access")
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decodedToken?._id)
    
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401,"Refresh token is expired")
    }


    const options = {
      httpOnly: true,
      secure:true
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
    user.refreshToken = newRefreshToken
    await user.save()

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, {
          accessToken,
          refreshToken: newRefreshToken,
        },
          "Access token refreshed"),
      );

  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
})

export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailverification,
  refreshAccessToken,
};