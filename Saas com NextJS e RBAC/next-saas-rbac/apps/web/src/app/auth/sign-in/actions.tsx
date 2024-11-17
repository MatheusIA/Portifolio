'use server'

import { z } from "zod"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signInWithPassword } from "@/http/sign-in-with-password"
import { HTTPError } from "ky"

const signInSchema = z.object({
  email: z.string().email({ message: "Please, provide a valid e-mail address."}),
  password: z.string().min(1, {message: "Please, provide your password"})
})

export async function signInWithEmailAndPassword(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors}
  }

  const { email, password } = result.data

  try {
    const { token } = await signInWithPassword({
      email: String(email),
      password: String(password)
     })
    
     ;(await cookies()).set('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
     })


  } catch(err) {
    if(err instanceof HTTPError) {
      const { message } = await err.response.json()

      return { success: false, message, errors: null}
    }

    console.error(err)

    return { 
      success: true, 
      message: 'Unexpected error, try again in a few minutes', 
      errors: null
    }
  }

  redirect('/')
}
