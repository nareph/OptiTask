"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { BuiltInProviderType } from "next-auth/providers/index";
import type { ClientSafeProvider, LiteralUnion } from "next-auth/react";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignInPage() {
    const [providers, setProviders] = useState<Record<
        LiteralUnion<BuiltInProviderType>, ClientSafeProvider
    > | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await getProviders();
                setProviders(res);
            } catch (err) {
                setError("Failed to load authentication providers");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col space-y-4 w-full max-w-md p-8">
                    <Skeleton className="h-10 w-3/4 mx-auto" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert variant="destructive" className="max-w-md">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!providers) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert variant="default">
                    <AlertDescription>No authentication providers available</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        Sign In to OptiTask
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {Object.values(providers).map((provider) => (
                        <Button
                            key={provider.name}
                            variant="outline"
                            className="w-full py-6 text-base"
                            onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                        >
                            {provider.id === "google" && (
                                <Icons.google className="mr-2 h-5 w-5" />
                            )}
                            {provider.id === "github" && (
                                <Icons.github className="mr-2 h-5 w-5" />
                            )}
                            Continue with {provider.name}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            <p className="mt-6 text-sm text-muted-foreground max-w-md text-center px-4">
                By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}