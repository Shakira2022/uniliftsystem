// /app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, CheckCircle, ArrowLeftCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch("/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to find contact details.");
            }

            // Using the message from the API to handle the success or "no match" case
            setMessage(data.message);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-primary font-heading">Forgot Password</h2>
                <p className="text-muted-foreground">
                    Enter your email to retrieve your password recovery contact details.
                </p>
            </div>

            <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription className="text-destructive">{error}</AlertDescription>
                            </Alert>
                        )}

                        {message && (
                            <Alert variant="default" className="border-green-500/20 bg-green-500/5">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-500">{message}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your.email@nwu.ac.za"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-11 bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                    Looking up details...
                                </div>
                            ) : (
                                "Get Contact Details"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Back to Login Button */}
            <div className="text-center mt-6">
                <Link href="/" passHref>
                    <Button variant="ghost" className="text-accent hover:text-accent/80 transition-colors gap-2">
                        <ArrowLeftCircle className="w-4 h-4" />
                        Back to Login
                    </Button>
                </Link>
            </div>
        </div>
    );
}