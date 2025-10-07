// AuthController every matter related to authorization

import crypto from 'crypto';
import getModels from "@/server/models/AAng/AAngLogistics";
import {auth} from "@/server/auth/auth";
import {hasPermission} from '@/server/utils/utilityFunction';
import {signUpSchema, validateSchema, logInSchema} from "@/validators/authValidators";

const ROLE_PREFIX = {
    admin: "/admin",
    client: "/client",
    driver: "/driver",
};

const accessLevel = [
    "super_admin",
    "platform_manager",
    "operations_manager",
    "customer_support",
    "finance_manager",
    "compliance_officer"
];

const ivLength = 12;

class AuthController {
    static async hashPassword(password) {
        try {
            const bcrypt = require("bcrypt");
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            console.error("Error hashing password:", error.message);
            throw new Error("Password hashing failed");
        }
    }

    static async comparePassword(plainPassword, hashedPassword) {
        try {
            const bcrypt = require("bcrypt");
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error("Error comparing passwords:", error.message);
            throw new Error("Password comparison failed");
        }
    }

    static async apiGuard(requiredRole) {
        const session = await auth();

        if (!session?.user) {
            throw new Error("Unauthorized: No active session");
        }

        if (session.user?.role !== requiredRole) {
            console.log(`Forbidden: ${session.user.role} cannot access ${requiredRole} resources`)
            throw new Error(`Forbidden: ${session.user.role} cannot access ${requiredRole} resources`);
        }

        return session.user;
    }

    static async requirePermission(user, resource, action) {
        if (!user?.adminRole) {
            throw new Error("Unauthorized: User role not found");
        }

        if (!hasPermission(user.adminRole, resource, action)) {
            throw new Error(`Forbidden: Role ${user.adminRole} cannot ${action} ${resource}`);
        }

        return true;
    }

    static async apiGuardWithPermission(requiredRole, resource, action) {
        const user = await AuthController.apiGuard(requiredRole);
        await AuthController.requirePermission(user, resource, action);
        return user;
    }

    // controllers/AuthController.js (only the function)
    static async googleSignup(credentials) {
        const {data, role} = credentials ?? {};

        // Hard invalid input: throw (your route will 400)
        if (!data || !role) {
            throw new Error("Invalid request: Missing requirements");
        }

        // Normalize role exactly as you want it stored
        const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

        try {
            const {email, name, image: picture, googleId} = data;
            if (!email || !googleId) {
                return {error: "Missing required Google profile fields (email/googleId)"};
            }

            const {AAngBase} = await getModels();
            let user = await AAngBase.findOne({email});

            if (user) {
                // Already linked to this Google account?
                const hasGoogleAuth = user.authMethods?.some(
                    (m) => m.type === "Google" && m.providerId === googleId
                );

                if (hasGoogleAuth) {
                    // Update last-used timestamp & prefs
                    const idx = user.authMethods.findIndex(
                        (m) => m.type === "Google" && m.providerId === googleId
                    );
                    if (idx !== -1) {
                        user.authMethods[idx].lastUsed = new Date();
                        user.preferredAuthMethod = "Google";
                        await user.save();
                    }

                    return {
                        userId: user._id.toString(),
                        userRole: user.role,
                        adminRole: user.adminRole,
                    };
                }

                // Not linked yet — ensure this googleId isn’t tied to another user
                const conflictUser = await AAngBase.findOne({
                    authMethods: {$elemMatch: {type: "Google", providerId: googleId}},
                });
                if (conflictUser) {
                    return {
                        error: "This Google account is already linked to another user",
                        suggestion: "Use another Google account or login with existing credentials.",
                    };
                }

                // Link Google to existing credentials account
                user.authMethods = user.authMethods ?? [];
                user.authMethods.push({
                    type: "Google",
                    providerId: googleId,
                    verified: true,
                    lastUsed: new Date(),
                });

                if (!user.fullName && name) user.fullName = name;
                if (!user.avatar && picture) user.avatar = picture;

                user.preferredAuthMethod = "Google";
                user.emailVerified = true;

                await user.save();

                return {
                    userId: user._id.toString(),
                    userRole: user.role,
                    adminRole: user.adminRole,
                };
            }

            // New user — create with Google auth
            user = await AAngBase.create({
                email,
                fullName: name,
                avatar: picture,
                authMethods: [
                    {
                        type: "Google",
                        providerId: googleId,
                        verified: true,
                        lastUsed: new Date(),
                    },
                ],
                preferredAuthMethod: "Google",
                provider: "Google",
                role: roleCapitalized,
                emailVerified: true,
                // Optional: keep a snapshot if your schema allows it
                googleCredentials: {
                    googleId,
                    email,
                    name,
                    picture,
                    emailVerified: true,
                },
            });

            return {
                userId: user._id.toString(),
                userRole: user.role,
                adminRole: user.adminRole,
            };
        } catch (err) {
            console.error("Social sign-in error:", err);
            // Business-safe error for route to convert to 400/401 as needed
            return {error: "Invalid Google token or authentication failed"};
        }
    }

    static async googleLogin(credentials) {
        const {data} = credentials ?? {};

        if (!data) {
            throw new Error("Invalid request: Missing requirements");
        }

        try {
            const {email, name, image: picture, googleId} = data;
            if (!email || !googleId) {
                return {error: "Missing required Google profile fields (email/googleId)"};
            }

            const {AAngBase} = await getModels();
            const user = await AAngBase.findOne({email});

            if (!user) {
                // ❌ No user found → This is a signup attempt, not login
                // Return error to trigger Auth.js "OAuthAccountNotLinked" flow
                return {error: "OAuthAccountNotLinked"};
            }

            // ✅ User exists → proceed with linking/login logic
            const hasGoogleAuth = user.authMethods?.some(
                (m) => m.type === "Google" && m.providerId === googleId
            );

            if (hasGoogleAuth) {
                // Update last-used timestamp
                const idx = user.authMethods.findIndex(
                    (m) => m.type === "Google" && m.providerId === googleId
                );
                if (idx !== -1) {
                    user.authMethods[idx].lastUsed = new Date();
                    user.preferredAuthMethod = "Google";
                    await user.save();
                }
            } else {
                // Check for Google ID conflict
                const conflictUser = await AAngBase.findOne({
                    authMethods: {$elemMatch: {type: "Google", providerId: googleId}},
                });
                if (conflictUser) {
                    return {
                        error: "This Google account is already linked to another user",
                        suggestion: "Use another Google account or login with existing credentials.",
                    };
                }

                // Link Google to existing account
                user.authMethods = user.authMethods || [];
                user.authMethods.push({
                    type: "Google",
                    providerId: googleId,
                    verified: true,
                    lastUsed: new Date(),
                });

                if (!user.fullName && name) user.fullName = name;
                if (!user.avatar && picture) user.avatar = picture;

                user.preferredAuthMethod = "Google";
                user.emailVerified = true;

                await user.save();
            }

            // ✅ Return user data for JWT
            return {
                userId: user._id.toString(),
                userRole: user.role,
                adminRole: user.adminRole,
            };
        } catch (err) {
            console.error("Google login error:", err);
            return {error: "Authentication failed. Please try again."};
        }
    }

    static async signUp(obj) {
        const {email, password, confirmPassword, role} = obj;

        if (!email || !password || !role || !confirmPassword) {
            return ({error: 'Missing required fields'});
        }

        const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

        const validation = await validateSchema(signUpSchema, obj);
        if (!validation.valid) {
            return ({error: validation.errors.join(', ')});
        }

        try {
            const {AAngBase} = await getModels();

            // Check if user already exists
            let user = await AAngBase.findOne({email});
            if (user) {
                // Get available auth methods
                const authMethods = user.authMethods?.map(am => am.type) || [];
                return ({
                    error: 'User already exists',
                    accountExists: true,
                    availableAuthMethods: authMethods,
                    code: 409
                });
            }

            // Hash password
            const hashedPassword = await AuthController.hashPassword(password);

            // Create user
            user = await AAngBase.create({
                email,
                password: hashedPassword,
                role: roleCapitalized,
                authMethods: [{
                    type: 'Credentials',
                    verified: false,
                    lastUsed: new Date()
                }],
                preferredAuthMethod: 'Credentials',
                provider: 'Credentials', // Backward compatibility
            });
            return (user);
        } catch (err) {
            console.error('Sign up error:', err);
            return ({error: 'Registration failed', code: 500});
        }
    }

    static async logIn(obj) {
        const {email, password,} = obj;

        if (!email || !password) {
            return ({error: 'Email and password are required'});
        }

        const validation = await validateSchema(logInSchema, obj);

        if (!validation.valid) {
            return ({error: validation.errors.join(', ')});
        }

        try {
            const {AAngBase} = await getModels();

            // Find user
            const user = await AAngBase.findOne({email});

            if (!user) {
                console.log('User not found')
                return ({error: 'Invalid email or password'});
            }

            // Check if user has password auth method
            const hasPasswordAuth = user.authMethods?.some(method => method.type === 'Credentials');

            if (!hasPasswordAuth) {
                // User exists but doesn't have password auth
                const availableAuthMethods = user.authMethods?.map(am => am.type) || [];

                return ({
                    error: 'This account does not use password authentication',
                    accountExists: true,
                    availableAuthMethods
                });
            }

            // Check password
            const isValidPassword = await AuthController.comparePassword(password, user.password);

            if (!isValidPassword) {
                return ({error: 'Invalid email or password'});
            }

            // Update last used timestamp for credentials auth method
            const credentialsIndex = user.authMethods.findIndex(m => m.type === 'Credentials');
            if (credentialsIndex !== -1) {
                user.authMethods[credentialsIndex].lastUsed = new Date();
                user.preferredAuthMethod = 'Credentials';
                await user.save();
            }
            return (user);

        } catch (err) {
            console.error('Login error:', err);
            return ({error: 'Login failed'});
        }
    }
}

export default AuthController;