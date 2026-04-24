"use client";

import { usePathname } from "next/navigation";

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");
    
    return (
        <main className={`flex-grow ${isAdmin ? "" : "min-h-[100dvh] pt-20"}`}>
            {children}
        </main>
    );
}
