import {Poppins} from "next/font/google";
import {Toaster} from "@/components/ui/sonner"
import {ThemeProvider} from "@/components/ThemeProvider/ThemeProvider"
import ReactQueryProvider from "@/components/ReactQuery/ReactQueryProvider";
import "./globals.css";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-poppins',
});

export const metadata = {
    title: "AAng Logistics — Fast, reliable deliveries",
    description:
        "End-to-end delivery logistics with real-time tracking, Paystack-native payments, and a powerful admin dashboard.",
};

export default function RootLayout({children}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${poppins.variable} font-sans antialiased h-screen overflow-hidden`} suppressHydrationWarning>
        <ReactQueryProvider>
            <Toaster
                richColors
                duration={4000}
                position="top-right"
                reverseOrder={false}
                closeOnClick
                expand={true}
            />
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </ReactQueryProvider>
        </body>
        </html>
    );
}
