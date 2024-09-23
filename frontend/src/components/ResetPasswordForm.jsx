import { Alert, AlertIcon, Link as ChakraLink, Stack, Box, FormControl, FormLabel, Input, Button, Heading } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { resetPassword } from "../lib/api"
import { useState } from "react"

// eslint-disable-next-line react/prop-types
const ResetPasswordForm = ({ code }) => {
    const [password, setPassword] = useState('')

    const {
        mutate: resetUserPassword,
        isPending,
        isSuccess,
        isError,
        error

    } = useMutation({
        mutationFn: resetPassword
    })



    return (
        <>
            <Heading fontSize='4xl' mb={8}>
                Change your password
            </Heading>
            <Box rounded="lg" bg="gray.700" boxShadow="lg" p={8}>
            {isError && (
                <Box mb={3} color='red.400'>
                    {error.message || "An error occurred"}
                </Box>

            )}
            {isSuccess ? (<Box>
                    <Alert status="success" w='fit-content' borderRadius={12}>
                        <AlertIcon />
                        Password updated successfully!
                    </Alert>
                    <ChakraLink as={Link} to="/login" replace>
                        Sign in
                    </ChakraLink>
                </Box>) : <Stack spacing={4}>
                    <FormControl id='password'>
                        <FormLabel>Password</FormLabel>
                        <Input type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={
                                (e) => e.key === "Enter" && resetUserPassword({ password, verificationCode: code })
                            }
                            autoFocus/>
                            <Button my={2} isDisabled={ password.length < 6}
                                isLoading={isPending}
                                onClick={
                                () => resetUserPassword({ password, verificationCode: code })
                            }>
                            Reset Password
                            </Button>
                    </FormControl>
                </Stack>
            }
            </Box>
        </>
  )
}

export default ResetPasswordForm