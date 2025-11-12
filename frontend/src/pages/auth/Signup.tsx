import React, { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import CTA from "@/components/ui/CTA";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/store/authStore";
import { ArrowRight, Mail, Lock, Loader2, User } from "lucide-react";

export default function Signup() {
  const { setLoading, setError, setSession, clearMessages, setSuccess } = useAuth(); // <-- UPDATED
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearMessages(); // <-- ADDED: Clear old messages
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      const { session, user } = data;

      if (session && user) {
        // User is logged in immediately
        const u = {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || null,
          teamId: user.user_metadata?.teamId || null,
        };
        setSession(u, session.access_token);

        // Set success message and redirect after a short delay
        setSuccess("Account created! Redirecting to your dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard"; // Use window.location to force a full refresh
        }, 1000); // 1 second delay

      } else {
        // Email confirmation is required
        setSuccess("Account created! Please check your email to confirm your account.");
        setSubmitting(false); // Re-enable form
      }
    } catch (err: any) {
      setError(err?.message || "Signup failed");
      setSubmitting(false); // Re-enable form on error
    } finally {
      // Don't set submitting to false here if we are redirecting
      setLoading(false); // You might not need this if not used
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} className="space-y-5">
        <h2 className="text-xl font-semibold">Create your account</h2>
        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          icon={<User className="h-4 w-4" />}
          disabled={submitting} // <-- ADDED
        />
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
              <Loader2 className="h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </CTA>
        <p className="text-sm text-white/60">
          Already have an account?{" "}
          <a href="/login" className="underline hover:text-white">
            Sign in
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}