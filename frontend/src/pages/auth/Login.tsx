// File: src/pages/auth/Login.tsx
import React, { useState } from "react";
// 1. We NO LONGER need useNavigate here.
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import CTA from "@/components/ui/CTA";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/store/authStore";
// 2. We NO LONGER need api or fetchProfile here.
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";

export default function Login() {
  // 3. We only need these actions.
  const { setLoading, setError, clearMessages, setSuccess } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearMessages();
    try {
      // 4. Step 1: Sign in to Supabase. That's IT.
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error; // Throws if login is invalid

      // 5. If successful, onAuthStateChange in main.tsx will
      //    automatically fire and call fetchProfile.
      //    The PublicOnly guard will see the user and redirect to /app.
      //    We just set a loading message here.
      setSuccess("Login successful! Redirecting...");
      
      // We don't navigate. We let the guards do the work.

    } catch (err: any) {
      // 6. The error handling is now much cleaner
      console.error("--- LOGIN FAILED ---");
      console.error("Full Error Object:", err);
      console.error("Error Message:", err?.message);
      console.error("----------------------");
      
      let userMessage = "Login failed. Please try again.";
      if (err?.message) {
        if (err.message.includes("Email not confirmed")) {
          userMessage = "Login failed. Please check your email inbox and click the confirmation link first.";
        } else if (err.message.includes("Invalid login credentials")) {
          userMessage = "Invalid email or password. Please try again.";
        }
      }
      
      setError(userMessage);
      setSubmitting(false); // Only set submitting to false on error
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} className="space-y-5">
        <h2 className="text-xl font-semibold">Welcome back</h2>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          icon={<Mail className="h-4 w-4" />}
          disabled={submitting}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          icon={<Lock className="h-4 w-4" />}
          disabled={submitting}
        />
        <CTA disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </CTA>
        <p className="text-sm text-white/60">
          New here?{" "}
          <a href="/signup" className="underline hover:text-white">
            Create an account
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}