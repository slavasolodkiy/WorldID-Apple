import { useState } from "react";
import { useLocation } from "wouter";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@workspace/api-client-react";

interface LoginPageProps {
  onLogin: (userId: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    try {
      const result = await loginMutation.mutateAsync({
        data: { username: username.trim() },
      });
      onLogin(result.userId);
      navigate("/");
    } catch {
      setError("Unknown username. Try: alex.world");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">World App</h1>
          <p className="text-sm text-muted-foreground text-center">
            Enter your username to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="h-12 text-base"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Demo account: <span className="font-mono text-foreground">alex.world</span>
        </p>
      </div>
    </div>
  );
}
