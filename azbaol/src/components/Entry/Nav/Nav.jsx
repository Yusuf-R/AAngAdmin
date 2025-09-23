'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useState, useMemo} from 'react';
import {usePathname} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { GradientText } from "@/components/ui/shadcn-io/gradient-text";
import {ModeToggle} from "@/components/ModeToggle";

/* --- Default inline SVG logo (fallback) --- */
function DefaultLogo(props) {
    return (
        <svg width="1em" height="1em" viewBox="0 0 324 323" fill="currentColor" aria-hidden="true" {...props}>
            <rect x="88.1023" y="144.792" width="151.802" height="36.5788" rx="18.2894"
                  transform="rotate(-38.5799 88.1023 144.792)"/>
            <rect x="85.3459" y="244.537" width="151.802" height="36.5788" rx="18.2894"
                  transform="rotate(-38.5799 85.3459 244.537)"/>
        </svg>
    );
}

/**
 * Flexible brand logo slot:
 * - Pass a ReactNode via `logo` (e.g., <YourSVG/>)
 * - OR pass `logoSrc` (e.g., '/vercel.svg' or '/logo.png') to use <Image/>
 */
function BrandMark({logo, logoSrc, size = 250, alt = 'AAng Logistics'}) {
    if (logo) return <span className="inline-flex" aria-hidden="true">{logo}</span>;
    if (logoSrc) {
        return (
            <Image
                src={logoSrc}
                alt={alt}
                width={size}
                height={size}
                priority
                className="inline-block"
            />
        );
    }
    return <DefaultLogo style={{width: size, height: size}}/>;
}

/* --- Simple hamburger icon --- */
function HamburgerIcon({className}) {
    return (
        <svg
            className={cn('pointer-events-none', className)}
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 7H20"/>
            <path d="M4 12H20"/>
            <path d="M4 17H20"/>
        </svg>
    );
}

/** Default links mapped to your actual pages (route groups don't show in URL) */
const DEFAULT_LINKS = [
    {href: '/home', label: 'Home'},
    {href: '/services', label: 'Services'},
    {href: '/about', label: 'About'},
    {href: '/contact', label: 'Contact'},
];

/**
 * Nav Component
 * - Center links are real Next.js <Link/> items
 * - Active link highlighted via usePathname()
 * - Mobile popover reuses the same links
 */
export default function Nav({
                                links = DEFAULT_LINKS,
                                brand = 'AAng Logistics',
                                logo,
                                logoSrc,
                                signInHref = '/auth/login',
                                getStartedHref = '/auth/role-select',
                            }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const normalizedPath = useMemo(() => pathname?.replace(/\/$/, '') || '/', [pathname]);
    const isActive = (href) => {
        const clean = href.replace(/\/$/, '') || '/';
        if ((clean === '/' && normalizedPath === '/') || (clean === '/home' && (normalizedPath === '/' || normalizedPath === '/home'))) {
            return true;
        }
        return normalizedPath === clean;
    };

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 md:px-6"
        >
            <div className="container mx-auto grid h-16 max-w-screen-2xl items-center grid-cols-[auto_1fr_auto] gap-4">
                {/* LEFT: brand + mobile menu trigger */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-primary hover:text-primary/90 no-underline"
                        aria-label="Go to home"
                    >
                        <span className="text-2xl leading-none">
                            <BrandMark logo={logo} logoSrc={logoSrc} size={60}/>
                        </span>
                        <span className="hidden sm:inline-block text-xl font-bold">{brand}</span>
                    </Link>

                    {/* Mobile menu */}
                    <div className="md:hidden">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button size="icon"
                                        variant="ghost"
                                        className="ml-1 h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                                        aria-label="Toggle menu"
                                >
                                    <HamburgerIcon/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-56 p-2">
                                <nav className="flex flex-col">
                                    {links.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                'rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors',
                                                isActive(link.href)
                                                    ? 'bg-accent text-accent-foreground'
                                                    : 'text-foreground/80 hover:text-foreground hover:bg-accent'
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <div className="mt-2 flex gap-2">
                                        <Link href={signInHref} onClick={() => setOpen(false)} className="flex-1">
                                            <Button variant="ghost" className="w-full h-9 text-sm">Sign In</Button>
                                        </Link>
                                        <Link href={getStartedHref} onClick={() => setOpen(false)} className="flex-1">
                                            <Button className="w-full h-9 text-sm">Get Started</Button>
                                        </Link>
                                    </div>
                                </nav>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* CENTER: desktop links */}
                <div className="hidden md:flex justify-center">
                    <NavigationMenu>
                        <NavigationMenuList className="gap-4">
                            {links.map((link) => (
                                <NavigationMenuItem key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            'group inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium no-underline transition-colors',
                                            isActive(link.href)
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-foreground/80 hover:text-foreground hover:bg-accent'
                                        )}
                                        aria-current={isActive(link.href) ? 'page' : undefined}
                                    >
                                        {link.label}
                                    </Link>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* RIGHT: actions */}
                <div className="hidden md:flex items-center justify-end gap-3">
                    <ModeToggle/>
                    <Link href={signInHref}>
                        <Button variant="ghost" size="sm"
                                className="bg-blue-500 text-white text-sm font-medium hover:bg-accent hover:text-amber-600">
                            Login
                        </Button>
                    </Link>
                    <Link href={getStartedHref}>
                        <Button size="sm" className="text-sm font-medium px-4 h-9 rounded-md shadow-sm">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
