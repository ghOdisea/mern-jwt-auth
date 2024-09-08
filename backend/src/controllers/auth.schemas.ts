import { z } from "zod";


const emailSchema = z.string().email().min(5).max(255)
const passwordSchema = z.string().min(6).max(255)
const useAgentSchema = z.string().optional()

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    useAgent: useAgentSchema
})

export const registerSchema = loginSchema.extend({
        confirmPassword: z.string().min(6).max(255),
    })
    .refine(
    (data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path:["confirmPassword"]
    }
);


