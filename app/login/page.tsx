import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and welcome content */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-primary font-heading">Welcome, Student!</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Sign in to request rides, track your transportation, and manage your travel schedule.
              </p>
            </div>

            <div className="space-y-4">
              
              
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <blockquote className="text-card-foreground/80 italic">
              "UniLift has transformed how students move around campus. Safe, reliable, and always on time."
            </blockquote>
            <cite className="text-sm text-muted-foreground mt-2 block">- NWU Student Council</cite>
          </div>
        </div>

        {/* Right side - Student Login form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md mx-auto space-y-6">
            <LoginForm type="student" />

            {/* Back button right under Sign In */}
            <Button
              asChild
              variant="outline"
              className="w-full h-11 bg-transparent hover:bg-muted-foreground/5 transition-all"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
