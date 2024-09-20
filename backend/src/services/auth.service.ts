//CONSTANTS
import { APP_ORIGIN } from "../constants/env"
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http"
import VerificationCodeType from "../constants/verificationCodeTypes"
//MODELS
import SessionModel from "../models/session.model"
import UserModel from "../models/user.model"
import VerificationCodeModel from "../models/verificationCode.model"
//UTILS
import appAssert from "../utils/appAssert"
import { hashValue } from "../utils/bcrypt"
import { fiveMinutesAgo, ONE_DAY_MS, oneHourFromNow, oneYearFromNow, thirtyDaysFromNow } from "../utils/date"
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTemplates"
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt"
import { sendEmail } from "../utils/sendMail"

export type CreateAccountParams = {
    email: string,
    password: string,
    userAgent?:string
}

export const createAccount = async(data: CreateAccountParams) => {

//verificar si existe el usuario
    const existingUser = await UserModel.exists({ email: data.email })

//Check de usuario con manejo de errores
    appAssert( !existingUser, CONFLICT, "Email already in use")
  
    //crear el usuario
    const user = await UserModel.create({
        email: data.email,
        password: data.password,
    })

    const userId = user._id
//crear codigo de verificacion

    const verificationCode = await VerificationCodeModel.create({
        userId,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    })
//enviar email de verificacion
    const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`

    const { error } = await sendEmail({
        to: user.email,
        ...getVerifyEmailTemplate(url)
    })

    if(error){
        console.log(error)
    }

//crear sesion
    const session = await SessionModel.create({
        userId,
        userAgent: data.userAgent
    })
//firmar accessToken y refreshToken

    const refreshToken = signToken({ sessionId: session._id }, refreshTokenSignOptions)

    const accessToken = signToken({ userId, sessionId: session._id })

//devolver usuario y tokens

    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    }
}

export type LoginParams = {
    email: string,
    password: string,
    userAgent?:string
}

export const loginUser = async ({email, password, userAgent}: LoginParams) => {
// get user by email
    const user = await UserModel.findOne({ email })
    appAssert(user, UNAUTHORIZED, "Invalid email or password")

//validate password
    const isValid = await user.comparePassword(password)
    appAssert(isValid, UNAUTHORIZED, "Invalid email or password")

    const userId = user._id

//create session
    const session = await SessionModel.create({
        userId,
        userAgent
    })

    const sessionInfo = {
        sessionId : session._id
    }

//sign access and refresh tokens
    
    const refreshToken = signToken(sessionInfo, refreshTokenSignOptions)

    const accessToken = signToken(
        {
            ...sessionInfo,
            userId: user._id,
        }
    )
//return user & tokens

return {
    user: user.omitPassword(),
    accessToken,
    refreshToken
} 
}

export const refreshUserAccessToken = async (refreshToken: string) => {
// validate refreshToken
    const {
        payload
    } = verifyToken<RefreshTokenPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret
    })
    
    appAssert(payload, UNAUTHORIZED, "invalid refresh token")

    const session = await SessionModel.findById(payload.sessionId)
    const now = Date.now()

// check expiration date
    appAssert(
        session && session.expiresAt.getTime() > now,
        UNAUTHORIZED,
        "Session expired"
    )

// refresh session if it expires in the next 24 hs
    const sessionNeedsRefresh = session.expiresAt.getDate() - now <= ONE_DAY_MS

    if( sessionNeedsRefresh ) {
        session.expiresAt = thirtyDaysFromNow()
        await session.save()
    }
// sign new tokens

    const newRefreshToken = sessionNeedsRefresh 
        ? signToken({
            sessionId: session._id 
            }, 
            refreshTokenSignOptions
        ) 
        : undefined;

    const accessToken = signToken({
            userId: session.userId,
            sessionId: session._id
        })
    return {
        accessToken,
        newRefreshToken
    }
}

export const verifyEmail = async (code: string) => {
    // get verification Code
    const validCode = await VerificationCodeModel.findById({
        _id: code,
        type: VerificationCodeType.EmailVerification,
        expiresAt: { $gt: new Date() }
    })

    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code")

    //get user by id + change "verified" status
    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId,
        { verified: true },
        { new: true }
    )

    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email")

    //delete verification Code
    await validCode.deleteOne()

    // return user
    return {
        user: updatedUser.omitPassword()
    }
}

export const sendPasswordResetEmail = async (email: string) => {
    //get user by email

    const user = await UserModel.findOne({ email })

    appAssert(user, NOT_FOUND, "User not found")

    //check email rate limit
    const fiveMinAgo = fiveMinutesAgo()
    const count = await VerificationCodeModel.countDocuments({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        createdAt: { $gt: fiveMinAgo }
    })

    appAssert(count <= 1 , TOO_MANY_REQUESTS, "Too many requests, please try again later")

    //create verification code
    const expiresAt = oneHourFromNow()

    const verificationCode = await VerificationCodeModel.create({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        expiresAt,
    })

    //send verification email
    const url = `${APP_ORIGIN}/password/reset?code=${
        verificationCode._id
    }&exp=${expiresAt.getTime()}`

    const {data, error} = await sendEmail({
        to: user.email,
        ...getPasswordResetTemplate(url)
    });

    appAssert( data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`)
    //return success

    return {
        url,
        emailId: data.id
    }

}

type ResetPasswordParams = {
    password: string,
    verificationCode: string
}

export const resetPassword = async ({ password, verificationCode } : ResetPasswordParams ) => {
//get verification code
const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() }
})

appAssert(validCode, NOT_FOUND, "Invalid or expired verification code")

//update users password
const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId,
    {
        password: await hashValue(password), 
    }
)

appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password")

//delete verification code

await validCode.deleteOne()

//delete all sessions
await SessionModel.deleteMany({
    userId: updatedUser._id
})

return {
    user: updatedUser.omitPassword()
}
}
