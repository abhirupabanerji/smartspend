import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(loginEmail, loginPass)) {
      toast.error("Invalid email or password");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPass) {
      toast.error("Please fill all fields");
      return;
    }
    if (!register(regEmail, regPass)) {
      toast.error("Email already registered");
    } else {
      toast.success("Account created!");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary-foreground">SmartSpend</h1>
            <p className="text-lg text-primary-foreground/80">
              Deep insights into your bank statements. Understand where your money goes.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: BarChart3, text: "Expense breakdown by category" },
              { icon: TrendingUp, text: "Transfer mode analytics" },
              { icon: Shield, text: "Secure, local-first processing" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - auth forms */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text inline-block lg:hidden">SmartSpend</CardTitle>
            <CardDescription className="lg:hidden">Analyze your spending patterns</CardDescription>
            <CardTitle className="hidden lg:block text-xl">Welcome back</CardTitle>
            <CardDescription className="hidden lg:block">Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-pass">Password</Label>
                    <Input
                      id="login-pass"
                      type="password"
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Log In</Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-pass">Password</Label>
                    <Input
                      id="reg-pass"
                      type="password"
                      placeholder="••••••••"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
