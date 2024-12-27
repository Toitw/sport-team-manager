import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "../hooks/use-user";
import { insertUserSchema, type InsertUser } from "@db/schema";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

type ResetPasswordData = {
  email: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "reader"
    }
  });

  const resetForm = useForm<ResetPasswordData>({
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (data: InsertUser) => {
    try {
      const result = await (isLogin ? login(data) : register(data));
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
        return;
      }
      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Registered successfully. Please check your email to verify your account."
      });
      if (isLogin) {
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const onResetPassword = async (data: ResetPasswordData) => {
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "If your email is registered, you'll receive password reset instructions."
      });

      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d')] bg-cover bg-center bg-no-repeat flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <Card className="w-[400px] relative bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Button type="submit" className="w-full">
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d')] bg-cover bg-center bg-no-repeat flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <Card className="w-[400px] relative bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sports Team Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value={isLogin ? "login" : "register"}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Button type="submit" className="w-full">
                      {isLogin ? "Login" : "Register"}
                    </Button>
                    {isLogin && (
                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setIsForgotPassword(true)}
                      >
                        Forgot Password?
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}