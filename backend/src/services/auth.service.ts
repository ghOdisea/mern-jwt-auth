import { CONFLICT, UNAUTHORIZED } from "../constants/http"
import VerificationCodeType from "../constants/verificationCodeTypes"
import SessionModel from "../models/session.model"
import UserModel from "../models/user.model"
import VerificationCodeModel from "../models/verificationCode.model"
import appAssert from "../utils/appAssert"
import { ONE_DAY_MS, oneYearFromNow, thirtyDaysFromNow } from "../utils/date"
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt"

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
        userId: user._id,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    })
//enviar email de verificacion
//TODO

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