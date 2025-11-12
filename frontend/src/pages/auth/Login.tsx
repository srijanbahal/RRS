import React, { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import CTA from "@/components/ui/CTA";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/store/authStore";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";

export default function Login() {
  const { setLoading, setError, setSession, fetchProfile, clearMessages, setSuccess } =
    useAuth(); // <-- UPDATED
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearMessages(); // <-- ADDED: Clear old messages
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { session } = data;
      if (session) {
        const user = session.user;
        const u = {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || null,
          teamId: user.user_metadata?.teamId || null,
        };
        setSession(u, session.access_token);
      }
      await fetchProfile();

      // Set success message and redirect after a short delay
      setSuccess("Login successful! Redirecting to your dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard"; // Use window.location to force a full refresh
      }, 1000); // 1 second delay

    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
      setLoading(false); // You might not need this if not used
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
          disabled={submitting} // <-- ADDED
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          icon={<Lock className="h-4 w-4" />}
          disabled={submitting} // <-- ADDED
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