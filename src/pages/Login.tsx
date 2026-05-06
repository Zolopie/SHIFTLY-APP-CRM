import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast({ title: 'Account created!', description: 'Check your email to verify.' });
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">

      {/* 🔥 ANIMATED GRADIENT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-600 to-purple-700 animate-gradient" />

      {/* 💡 GLOW EFFECTS */}
      <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-blue-400 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-20 rounded-full blur-3xl" />

      {/* OPTIONAL LOGO */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-10"
        style={{ backgroundImage: "url('/shiftly-logo.png')" }}
      />

      {/* 💎 LOGIN CARD */}
      <Card className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20">

        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-400 p-4 shadow-xl shadow-blue-900/30">
            <BrandLogo showText={false} className="text-white" />
          </div>

          <CardTitle className="text-2xl">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>

          <CardDescription>
            {isSignUp
              ? 'Set up your workforce management account'
              : 'Sign in to your Shiftly dashboard'}

          </CardDescription>
          <CardDescription>
            {isSignUp
              ? 'Set up your workforce management account'
              : ' email: admin123@test.com password: testaccount?'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {isSignUp && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button className="w-full" disabled={loading || authLoading}>
              {loading || authLoading
                ? 'Loading...'
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </Button>

          </form>

          <div className="mt-4 flex flex-col gap-3">

            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  setLoading(true);
                  await signInWithGoogle();
                } catch (err: any) {
                  toast({
                    title: 'Google sign-in failed',
                    description: err.message,
                    variant: 'destructive'
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full"
              disabled={loading || authLoading}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="text-center text-sm text-white/80">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-white font-medium hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}