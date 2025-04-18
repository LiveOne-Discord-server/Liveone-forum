
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/ui/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Github, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase";
import { useLanguage } from "@/hooks/useLanguage";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { login, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowContent(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [open]);

  const handleLogin = async (provider: 'github' | 'discord' | 'google') => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      toast.error(`Failed to sign in with ${provider}`);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsProcessing(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Account created! Check your email for verification link.");
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Signed in successfully!");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800 p-0">
        <div className="flex flex-col items-center justify-center space-y-8 p-6">
          <div className="w-full flex flex-col items-center justify-center mb-4">
            <div className="mb-6">
              <Logo animated size="lg" />
            </div>
            
            {showContent ? (
              <div className="w-full space-y-4 animate-fadeIn">
                <h2 className="text-xl text-center font-bold mb-4">
                  {isSignUp ? "Create an account" : "Sign in to your account"}
                </h2>
                
                <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    disabled={isProcessing}
                  >
                    {isProcessing 
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> 
                      : (isSignUp ? "Create Account" : "Sign In")}
                  </Button>
                </form>
                
                <div className="text-center text-sm">
                  <button 
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                    }} 
                    className="text-neon-orange hover:underline"
                  >
                    {isSignUp 
                      ? "Already have an account? Sign in" 
                      : "Need an account? Sign up"}
                  </button>
                </div>
                
                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="flex-shrink mx-4 text-gray-400">or continue with</span>
                  <div className="flex-grow border-t border-gray-700"></div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleLogin('google')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current text-red-500">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleLogin('discord')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-6 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 hover:border-[#5865F2]/30 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <MessageSquare className="h-5 w-5 text-[#5865F2]" />
                    <span>Continue with Discord</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleLogin('github')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-6 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Github className="h-5 w-5" />
                    <span>Continue with GitHub</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="animate-pulse w-10 h-10 bg-neon-purple/20 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
