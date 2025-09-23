"use client";
import Nav from "@/components/Entry/Nav/Nav"

function EntryLayout({children}) {
    return (
        <>
            <div className="flex flex-col min-h-screen">
                <Nav logoSrc="/azbaol.svg" brand="AAngLogistics"/>

                {/* Scrollable Main Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </>
    );
}

export default EntryLayout;