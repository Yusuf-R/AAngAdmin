// src/server/auth/options.js
import AuthController from "@/server/controllers/AuthController";
import dbClient from "@/server/db/mongoDb"; // MongoDB client connection
import getModels from "@/server/models/AAng/AAngLogistics"; // User model
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const options = {
    secret: process.env.AUTH_SECRET,
    providers: [
        Google,
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                try {
                    // Ensure connection to MongoDB
                    await dbClient.connect();

                    // Load the models (all roles use the same AAngBase base schema)
                    const {AAngBase} = await getModels();

                    // Find the user by email
                    const user = await AAngBase.findOne({email: credentials.email}).select("+password");
                    if (!user) throw new Error("User not found");

                    // Check if the password is correct
                    const isPasswordValid = await AuthController.comparePassword(credentials.password, user.password);
                    if (!isPasswordValid) throw new Error("Invalid credentials");

                    // Return minimal user object for token (id and role)
                    return {
                        id: user._id,
                        role: user.role.toLowerCase(),
                        adminRole: user.adminRole || null,
                        name: 'Credential User'
                    };
                } catch (error) {
                    console.error("Authorization error:", error.message);
                    return null;
                } finally {
                    // Close the MongoDB connection
                    await dbClient.close();
                }

            }
        }),
        Credentials({
            id: 'signup-credentials',
            name: 'SignUp Credentials',
            credentials: {
                email: {},
                password: {},
                role: {},
            },
            authorize: async (credentials) => {
                try {
                    await dbClient.connect();
                    const user = await AuthController.signUp(credentials);
                    if (!user) throw new Error("User not found");
                    return {
                        id: user._id,
                        role: user.role.toLowerCase(),
                        adminRole: user.adminRole || null,
                        name: 'Credential User'
                    };
                } catch (error) {
                    console.error("Authorization error:", error.message);
                    return null;
                } finally {
                    // Close the MongoDB connection
                    await dbClient.close();
                }

            }
        }),
        Credentials({
            id: 'login-credentials',
            name: 'LoginCredentials',
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                try {
                    await dbClient.connect();
                    const user = await AuthController.logIn(credentials);
                    if (!user) throw new Error("User not found");
                    return {
                        id: user._id,
                        role: user.role.toLowerCase(),
                        adminRole: user.adminRole || null,
                        name: 'Credential User'
                    };
                } catch (error) {
                    console.error("Authorization error:", error.message);
                    return null;
                } finally {
                    // Close the MongoDB connection
                    await dbClient.close();
                }

            }
        }),
        Credentials({
            id: 'google-signup',
            name: 'GoogleSignup',
            credentials: {
                id: {},
                role: {},
                adminRole: {},
            },
            authorize: async (credentials) => {
                return {
                    id: credentials?.id,
                    role: credentials?.role,
                    adminRole: credentials?.adminRole || null,
                    name: 'Google User'
                };
            }
        }),
        Credentials({
            id: 'google-login',
            name: 'GoogleLogin',
            credentials: {
                id: {},
                role: {},
                adminRole: {},
            },
            authorize: async (credentials) => {
                return {
                    id: credentials?.id,
                    role: credentials?.role,
                    adminRole: credentials?.adminRole || null,
                    name: 'Google User'
                };
            }
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 3 * 30 * 24 * 60 * 60, // Set a shorter 3-month expiration for security
        updateAge: 24 * 60 * 60, // Update the session every 24 hours
        encryption: true,
    },
    jwt: {
        encryption: true,
    },
    callbacks: {
        /**
         * when the auth signIn (google) returns from signIn it return an object that contains user object,
         * profile object
         * Then in return it returns back to the main fxn call with
         * ok, data, error
         */
        async signIn({user, account, profile}) {
            if (account?.provider === 'google' && profile) {
                try {
                    // Store Google data temporarily in user object
                    user.tempGoogleData = {
                        email: profile.email,
                        name: profile.name,
                        image: user.image ?? profile.picture ?? "",
                        googleId: profile.sub,
                        emailVerified: profile.email_verified ?? false,
                    };
                    return true;
                } catch (err) {
                    console.error("Error storing Google data:", err);
                    return false;
                }
            }
            return true;
        },
        async signOut({}){},
        async jwt({token, user, account}) {
            // Store temp Google data for registration
            if (account?.provider === 'google' && user?.tempGoogleData) {
                token.tempGoogleData = user.tempGoogleData;
            }

            // Set final JWT payload for google-signup
            if (account?.provider === 'google-signup' && user) {
                token.id = user.id;
                token.role = user.role;
                token.loginMethod = 'google';
                token.adminRole = user.adminRole || null;
                delete token.tempGoogleData; // Clean up
            }
            // Set final JWT payload for google-login
            if (account?.provider === 'google-login' && user) {
                token.id = user.id;
                token.role = user.role;
                token.loginMethod = 'google';
                token.adminRole = user.adminRole || null;
                delete token.tempGoogleData; // Clean up
            }

            // Set final JWT payload for credentials
            if (account?.provider === 'credentials' && user) {
                token.id = user.id;
                token.role = user.role;
                token.adminRole = user.adminRole || null;
                token.loginMethod = 'email';
            }

            if (account?.provider === 'signup-credentials' && user) {
                token.id = user.id;
                token.role = user.role;
                token.adminRole = user.adminRole || null;
                token.loginMethod = 'email';
            }

            if (account?.provider === 'login-credentials' && user) {
                token.id = user.id;
                token.role = user.role;
                token.adminRole = user.adminRole || null;
                token.loginMethod = 'email';
            }

            return token;
        },
        async session({session, token}) {
            if (token.id && token.role) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.adminRole = token.adminRole || null;
                session.user.loginMethod = token.loginMethod;
            }

            // Expose temp data for registration flow
            if (token.tempGoogleData) {
                session.tempGoogleData = token.tempGoogleData;
            }
            return session;
        },
    },
};

export default options;