// src/server/auth/auth.js
import NextAuth from "next-auth"
import options from "@/server/auth/options";

export const { handlers, signIn, signOut, auth } = NextAuth(options)