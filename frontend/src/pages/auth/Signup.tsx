// File: src/pages/auth/Signup.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import CTA from "@/components/ui/CTA";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/store/authStore";
import type { UserRole } from "@/store/authStore";
import { ArrowRight, Mail, Lock, Loader2, User, Users, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function Signup() {
  const { setLoading, setError, clearMessages, setSuccess } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<UserRole>("participant");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearMessages();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role, 
          },
        },
      });
      if (error) throw error;
      
      setSuccess("Account created! Please check your email to confirm your account. Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login"); 
      }, 3000);

    } catch (err: any) {
      console.error("Signup Error:", err.message);
      
      let userMessage = err.message || "Signup failed";
      
      if (err.message.includes("User already registered")) {
        userMessage = "This email is already registered. Please sign in instead.";
      } else if (err.message.includes("Database error saving new user")) {
         // This catches the exact error you are seeing
         userMessage = "A database error occurred. (Check SQL trigger).";
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
        <h2 className="text-xl font-semibold">Create your account</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <RoleButton
            label="Participant"
            desc="Create a team and race"
            icon={<Users className="h-4 w-4" />}
            isActive={role === 'participant'}
            onClick={() => setRole('participant')}
          />
          <RoleButton
            label="Spectator"
            desc="Watch live races"
            icon={<Eye className="h-4 w-4" />}
            isActive={role === 'spectator'}
            onClick={() => setRole('spectator')}
          />
        </div>

        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          icon={<User className="h-4 w-4" />}
          disabled={submitting}
        />
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

// Helper component for the role button
const RoleButton = ({ label, desc, icon, isActive, onClick }: any) => (
  <motion.button
    type="button"
    onClick={onClick}
    animate={isActive ? { scale: 1.02 } : { scale: 1 }}
    className={`p-4 rounded-2xl border text-left transition-all duration-200
                ${isActive
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                }`}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    <p className="text-xs text-white/60 mt-1">{desc}</p>
  </motion.button>
);