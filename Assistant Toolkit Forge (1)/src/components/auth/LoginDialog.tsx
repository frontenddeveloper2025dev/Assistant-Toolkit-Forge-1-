import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  
  const { sendOTP, verifyOTP, isLoading, error, clearError } = useAuthStore()
  const { toast } = useToast()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      await sendOTP(email)
      setStep('otp')
      toast({
        title: 'OTP Sent',
        description: `Verification code sent to ${email}`
      })
    } catch (error) {
      // Error handled by store
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return

    try {
      await verifyOTP(email, otp)
      onOpenChange(false)
      setStep('email')
      setEmail('')
      setOtp('')
      toast({
        title: 'Welcome!',
        description: 'Successfully logged in to your assistant'
      })
    } catch (error) {
      // Error handled by store
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    clearError()
  }

  const handleClose = () => {
    onOpenChange(false)
    setStep('email')
    setEmail('')
    setOtp('')
    clearError()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Sign In to Assistant
          </DialogTitle>
          <DialogDescription>
            Access your AI-powered productivity tools with secure email verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'email' ? (
            <div key="email">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Verification
                  </CardTitle>
                  <CardDescription>
                    Enter your email to receive a verification code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div key="otp">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Enter Verification Code</CardTitle>
                  <CardDescription>
                    Check your email for the 6-digit code sent to {email}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={isLoading}
                        maxLength={6}
                        required
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isLoading || otp.length !== 6}>
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Sign In'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}