
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Eye, EyeOff, Github, Mail, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HCaptcha from '@/components/auth/HCaptcha';

const Auth = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (mode === 'signup') {
      if (!username.trim()) {
        setErrorMessage(t.auth?.usernameRequired || 'Username is required');
        setLoading(false);
        return;
      }

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          }
        });

        if (error) throw error;

        // Show success message but keep the user on the same page
        toast.success(t.auth?.verifyEmail || 'Please check your email to verify your account');
        setMode('signin');
      } catch (error: any) {
        console.error('Sign up error:', error);
        setErrorMessage(error.message || t.auth?.signupError || 'An error occurred during signup');
      }
    } else {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        navigate('/');
      } catch (error: any) {
        console.error('Sign in error:', error);
        setErrorMessage(error.message || t.auth?.signinError || 'Invalid email or password');
      }
    }

    setLoading(false);
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('GitHub login error:', error);
      toast.error(error.message || t.auth?.oauthError || 'Error signing in with GitHub');
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || t.auth?.oauthError || 'Error signing in with Google');
    }
  };
  
  const handleDiscordLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Discord login error:', error);
      toast.error(error.message || t.auth?.oauthError || 'Error signing in with Discord');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'signin' ? (t.auth?.signIn || 'Sign In') : (t.auth?.signUp || 'Sign Up')}</CardTitle>
          <CardDescription>
            {mode === 'signin' 
              ? (t.auth?.signInDescription || 'Enter your credentials to access your account') 
              : (t.auth?.signUpDescription || 'Create an account to get started')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t.auth?.signIn || 'Sign In'}</TabsTrigger>
              <TabsTrigger value="signup">{t.auth?.signUp || 'Sign Up'}</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSignUp}>
              <div className="space-y-4 mt-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="username">{t.auth?.username || 'Username'}</Label>
                    <Input
                      id="username"
                      placeholder={t.auth?.usernamePlaceholder || 'Enter your username'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth?.email || 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.auth?.emailPlaceholder || 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth?.password || 'Password'}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t.auth?.passwordPlaceholder || 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading 
                    ? (t.common?.loading || 'Loading...') 
                    : mode === 'signin' 
                      ? (t.auth?.signIn || 'Sign In') 
                      : (t.auth?.signUp || 'Sign Up')}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t.auth?.orContinueWith || 'Or continue with'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGithubLogin}
                    disabled={loading}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleDiscordLogin}
                    disabled={loading}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Discord
                  </Button>
                </div>
              </div>
            </form>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {mode === 'signin' ? (
              <>
                {t.auth?.noAccount || "Don't have an account?"}{' '}
                <Link 
                  to="#" 
                  className="underline underline-offset-4 hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('signup');
                  }}
                >
                  {t.auth?.signUp || 'Sign up'}
                </Link>
              </>
            ) : (
              <>
                {t.auth?.haveAccount || 'Already have an account?'}{' '}
                <Link 
                  to="#" 
                  className="underline underline-offset-4 hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('signin');
                  }}
                >
                  {t.auth?.signIn || 'Sign in'}
                </Link>
              </>
            )}
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              {t.auth?.termsAndConditions || 'Terms & Conditions'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
