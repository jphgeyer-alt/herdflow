"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

type UserData = {
  id: string;
  email: string;
  fullName: string;
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setFullName(data.user.fullName || "");
          setPhone(data.user.phone || "");
        } else {
          router.push("/auth/login");
        }
      })
      .finally(() => setLoadingUser(false));
  }, [router]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess(true);
        setUser((prev) => (prev ? { ...prev, fullName } : prev));
      } else {
        setProfileError(data.error || "Failed to update profile");
      }
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/dashboard/buyer`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black mb-2">Account Settings</h1>
          <p className="text-white/80">Manage your profile and security settings</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-8">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1B3A6B] flex items-center gap-2">
                <User size={20} /> Profile Information
              </h2>
              <p className="text-sm text-[#5d7497]">{user.email}</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 size={16} /> Profile updated successfully.
            </div>
          )}
          {profileError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">
                Email Address <span className="text-[#5d7497] font-normal">(cannot be changed)</span>
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-[#e4ebf5] bg-[#f5f8fd] text-[#5d7497] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="+27 82 123 4567"
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-3 px-8 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8">
          <h2 className="text-xl font-black text-[#1B3A6B] flex items-center gap-2 mb-6">
            <Lock size={20} /> Change Password
          </h2>

          {passwordSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 size={16} /> Password changed successfully.
            </div>
          )}
          {passwordError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="Re-enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-[#1B3A6B] hover:bg-[#244367] text-white font-bold uppercase tracking-wide py-3 px-8 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
