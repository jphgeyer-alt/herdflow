"use client";

import { useState, FormEvent } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, subject, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setFullName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black mb-2">Contact Us</h1>
          <p className="text-lg text-white/80">We're here to help. Get in touch with our team.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Get in Touch</h2>
              <p className="text-[#5d7497] leading-relaxed">
                Whether you're a buyer, seller, or logistics partner, our team is ready to assist you with any questions or concerns.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#2E7D32] rounded-xl">
                  <Mail size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#244367] mb-1">Email</h3>
                  <p className="text-[#5d7497]">support@herdflow.co.za</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#2E7D32] rounded-xl">
                  <Phone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#244367] mb-1">Phone</h3>
                  <p className="text-[#5d7497]">+27 82 123 4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#2E7D32] rounded-xl">
                  <MapPin size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#244367] mb-1">Address</h3>
                  <p className="text-[#5d7497]">
                    Geyer Holdings<br />
                    North West Province<br />
                    South Africa
                  </p>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <svg className="w-8 h-8 text-[#1877F2] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <div>
                  <p className="font-semibold text-[#244367] text-sm">Follow HerdFlow on Facebook</p>
                  <a
                    href="https://www.facebook.com/share/1cUWCfQwut/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1877F2] text-sm hover:underline font-medium"
                  >
                    Follow our Facebook page →
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <h3 className="font-bold text-[#244367] mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Monday - Friday</span>
                  <span className="font-semibold text-[#244367]">8:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Saturday</span>
                  <span className="font-semibold text-[#244367]">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Sunday</span>
                  <span className="font-semibold text-[#244367]">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-8">
            <h2 className="text-2xl font-black text-[#1B3A6B] mb-6">Send us a Message</h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                Thank you! Your message has been sent successfully. We'll get back to you soon.
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-2">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-2">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-2">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                  placeholder="+27 82 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-2">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                  placeholder="How can we help you?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-2">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20 resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-4 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={20} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
