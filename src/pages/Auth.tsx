import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Mail, Lock, User, Loader2, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .regex(PASSWORD_REQUIREMENTS.hasUppercase, 'Password must contain at least one uppercase letter')
    .regex(PASSWORD_REQUIREMENTS.hasLowercase, 'Password must contain at least one lowercase letter')
    .regex(PASSWORD_REQUIREMENTS.hasNumber, 'Password must contain at least one number')
    .regex(PASSWORD_REQUIREMENTS.hasSpecial, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type AuthMode = 'login' | 'signup' | 'forgot-password';

// Password strength indicator component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= PASSWORD_REQUIREMENTS.minLength },
    { label: 'Uppercase letter (A-Z)', met: PASSWORD_REQUIREMENTS.hasUppercase.test(password) },
    { label: 'Lowercase letter (a-z)', met: PASSWORD_REQUIREMENTS.hasLowercase.test(password) },
    { label: 'Number (0-9)', met: PASSWORD_REQUIREMENTS.hasNumber.test(password) },
    { label: 'Special character (!@#$%^&*)', met: PASSWORD_REQUIREMENTS.hasSpecial.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const strengthPercent = (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (metCount <= 2) return 'bg-destructive';
    if (metCount <= 3) return 'bg-orange-500';
    if (metCount <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors", getStrengthColor())}
          initial={{ width: 0 }}
          animate={{ width: `${strengthPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(
              "transition-colors",
              req.met ? "text-green-500" : "text-muted-foreground"
            )}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Get the intended destination
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/lobby';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', username: '', password: '', confirmPassword: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Watch password for strength indicator
  const watchedPassword = useWatch({ control: signupForm.control, name: 'password' });
  const watchedUsername = useWatch({ control: signupForm.control, name: 'username' });

  // Check username availability
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validate format first
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    
    const { data, error } = await supabase
      .from('player_profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus(data ? 'taken' : 'available');
  }, []);

  // Debounced username check
  const debouncedCheckUsername = useDebouncedCallback(checkUsername, 500);

  // Watch username changes
  useEffect(() => {
    if (mode === 'signup' && watchedUsername) {
      debouncedCheckUsername(watchedUsername);
    } else {
      setUsernameStatus('idle');
    }
  }, [watchedUsername, mode, debouncedCheckUsername]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      let message = 'Failed to sign in';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please check your email and confirm your account';
      }
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: message,
      });
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
    navigate(from, { replace: true });
  };

  const handleSignup = async (data: SignupFormData) => {
    // Check username one more time before submitting
    if (usernameStatus === 'taken') {
      toast({
        variant: 'destructive',
        title: 'Username taken',
        description: 'Please choose a different username.',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.username);
    setIsSubmitting(false);

    if (error) {
      let message = 'Failed to create account';
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Try signing in instead.';
      } else if (error.message.includes('Username is already taken')) {
        message = 'This username is already taken. Please choose another.';
        setUsernameStatus('taken');
      }
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: message,
      });
      return;
    }

    toast({
      title: 'Account created!',
      description: 'You can now sign in and start playing.',
    });
    navigate(from, { replace: true });
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await resetPassword(data.email);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send reset email',
        description: error.message,
      });
      return;
    }

    toast({
      title: 'Check your email',
      description: 'We sent you a password reset link.',
    });
    setMode('login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <Rocket className="h-10 w-10 text-primary" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-poker-gold animate-pulse" />
              </div>
              <span className="font-display text-3xl font-bold tracking-wider">
                <span className="text-poker-gold">O'Rocket</span>
                <span className="text-primary"> Hold'em</span>
              </span>
            </div>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-display text-2xl">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot-password' && 'Reset Password'}
              </CardTitle>
              <CardDescription>
                {mode === 'login' && 'Sign in to continue playing'}
                {mode === 'signup' && 'Join the poker revolution'}
                {mode === 'forgot-password' && 'Enter your email to receive a reset link'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        {...loginForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              )}

              {mode === 'signup' && (
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        {...signupForm.register('email')}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="PokerPro123"
                        className={cn(
                          "pl-10 pr-10",
                          usernameStatus === 'available' && "border-green-500 focus-visible:ring-green-500",
                          usernameStatus === 'taken' && "border-destructive focus-visible:ring-destructive"
                        )}
                        {...signupForm.register('username')}
                      />
                      {usernameStatus === 'checking' && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {usernameStatus === 'available' && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {usernameStatus === 'taken' && (
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {signupForm.formState.errors.username && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.username.message}</p>
                    )}
                    {usernameStatus === 'taken' && !signupForm.formState.errors.username && (
                      <p className="text-sm text-destructive">This username is already taken</p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-sm text-green-500">Username is available!</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        {...signupForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={watchedPassword || ''} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10"
                        {...signupForm.register('confirmPassword')}
                      />
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              )}

              {mode === 'forgot-password' && (
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        {...forgotPasswordForm.register('email')}
                      />
                    </div>
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{forgotPasswordForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Reset Link
                  </Button>
                </form>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot your password?
                  </button>
                  <div className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <div className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {mode === 'forgot-password' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-primary hover:underline"
                >
                  Back to sign in
                </button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}