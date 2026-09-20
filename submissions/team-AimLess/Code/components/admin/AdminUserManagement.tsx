import React, { useState } from "react";
import { User, UserRole } from "@/types/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Users, UserPlus, X, Check, ShieldCheck, Mail, Phone } from "lucide-react";

interface AdminUserManagementProps {
  users: User[];
  onUserCreated: () => void;
}

export function AdminUserManagement({ users, onUserCreated }: AdminUserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("AMBULANCE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.provisionUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });

      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      onUserCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create staff user.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#141414]">Registered System Users</h3>
          <p className="text-xs text-[#707070]">
            Manage authorized citizen accounts and operational agency credentials.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold uppercase tracking-wider self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Provision Staff Account
        </Button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E0E0E0] bg-[#F3F3F3] text-[#707070] uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4 rounded-l-[14px]">User Name</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Email Address</th>
              <th className="py-3.5 px-4">Contact Phone</th>
              <th className="py-3.5 px-4">User ID</th>
              <th className="py-3.5 px-4 rounded-r-[14px]">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E0E0]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#F9F9F9] transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#141414]">{u.name}</td>
                <td className="py-3.5 px-4">
                  <Badge
                    variant={u.role === "ADMIN" ? "dark" : u.role === "CITIZEN" ? "default" : "dark"}
                    className={
                      u.role === "ADMIN"
                        ? "bg-purple-900 text-purple-200"
                        : u.role === "AMBULANCE"
                        ? "bg-blue-900 text-blue-200"
                        : u.role === "HOSPITAL"
                        ? "bg-emerald-900 text-emerald-200"
                        : ""
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-[#707070]">{u.email}</td>
                <td className="py-3.5 px-4 text-[#707070]">{u.phone || "—"}</td>
                <td className="py-3.5 px-4 font-mono text-[#ADADAD] text-[11px]">{u.id}</td>
                <td className="py-3.5 px-4 text-[#707070]">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "System Seed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[24px] border border-[#E0E0E0] shadow-2xl p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0] mb-5">
              <h3 className="text-lg font-bold text-[#141414]">Provision Agency Account</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#F0F0F0] text-[#707070]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-[12px] bg-red-50 text-red-700 text-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141414] block mb-1">
                  Role Authority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["AMBULANCE", "HOSPITAL", "ADMIN"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-full text-xs font-bold border transition-all ${
                        role === r
                          ? "bg-[#141414] text-white border-[#141414]"
                          : "bg-white text-[#707070] border-[#E0E0E0]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Full Name / Station Name"
                type="text"
                placeholder="e.g. Unit A-02 Driver"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Official Email"
                type="email"
                placeholder="e.g. ambulance02@aimless.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Dispatch Contact Phone"
                type="tel"
                placeholder="e.g. +15550000005"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Input
                label="Initial Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs uppercase tracking-wider font-semibold"
                >
                  Create Staff Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
