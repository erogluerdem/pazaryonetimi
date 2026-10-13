import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen min-h-[100dvh] w-full bg-background text-foreground">
            {children}
        </div>
    );
}
