"use server"

import { cookies } from "next/headers"
import { createUser, validateUser } from "@/lib/db"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
      return { success: false, message: "All fields are required" }
    }

    const userId = await createUser({ name, email, password })

    // Set session cookie
    ;(await
      // Set session cookie
      cookies()).set("userId", userId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, userId: userId.toString() }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to sign up" }
  }
}

export async function login(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    const user = await validateUser(email, password)

    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    // Set session cookie
    (await
      // Set session cookie
      cookies()).set("userId", user._id!.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, userId: user._id!.toString() }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to log in" }
  }
}

export async function logout() {
  (await cookies()).delete("userId")
  redirect("/")
}

export async function getCurrentUser() {
  const userId = (await cookies()).get("userId")?.value

  if (!userId) {
    return null
  }

  return { id: userId }
}
