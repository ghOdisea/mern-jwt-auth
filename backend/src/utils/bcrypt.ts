import bcrypt from 'bcrypt'

export const hashValue = async (value: string, salRounds?: number) => 
    bcrypt.hash(value, salRounds || 10)


export const compareValue = async(value: string, hashedValue:string) =>
    bcrypt.compare(value, hashedValue).catch(() => false)
