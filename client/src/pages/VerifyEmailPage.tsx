import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    fetch(`/api/verify-email?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        setStatus("success");
        setMessage("Email verified successfully. You can now log in.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.message || "Failed to verify email");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d')] bg-cover bg-center bg-no-repeat flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <Card className="w-[400px] relative bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-4">
            {status === "loading" && (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
            <p className="text-center">{message}</p>
          </div>
          <Button
            className="w-full"
            onClick={() => setLocation("/auth")}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
