import { api } from "./api-client"

interface SignInWhitePasswordRequest {
    email: string
    password: string
}

interface SignInWithPasswordResponse {
    token: string
}

export async function signInWithPassword({
    email, 
    password
}: SignInWhitePasswordRequest) {
    const result = await api.post('sessions/password', {
        json: {
          email,
          password,
        },
      }).json<SignInWithPasswordResponse>()

    return result
}