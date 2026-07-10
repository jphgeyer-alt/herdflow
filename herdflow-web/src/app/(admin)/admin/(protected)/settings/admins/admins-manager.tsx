"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, KeyRound } from "lucide-react";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Button } from "@/components/admin/Button";
import { Badge, RoleBadge } from "@/components/admin/Badge";
import { Modal } from "@/components/admin/Modal";
import { Input, Select } from "@/components/admin/Field";

type AdminRow = {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  lastLoginAt: string | Date | null;
  createdAt: string | Date;
};

function formatDate(value: string | Date | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(value));
}

export function AdminsManager({
  initialAdmins,
  me,
}: {
  initialAdmins: AdminRow[];
  me: { id: string; email: string; fullName: string; role: string };
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = me.role === "SUPER_ADMIN";

  async function toggleActive(admin: AdminRow) {
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !admin.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update admin.");
      return;
    }
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, isActive: !admin.isActive } : a)),
    );
    toast.success(admin.isActive ? "Admin deactivated" : "Admin reactivated");
  }

  async function changeRole(admin: AdminRow, role: "SUPER_ADMIN" | "ADMIN") {
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update role.");
      return;
    }
    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, role } : a)));
    toast.success("Role updated");
  }

  async function handleAddAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") || ""),
      fullName: String(form.get("fullName") || ""),
      password: String(form.get("password") || ""),
      role: String(form.get("role") || "ADMIN"),
    };

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to create admin.");
        return;
      }
      setAdmins((prev) => [...prev, data.admin]);
      toast.success("Admin account created");
      setAddOpen(false);
      e.currentTarget.reset();
    } catch {
      toast.error("Network error creating admin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Staff Accounts"
          description={`${admins.length} admin account${admins.length === 1 ? "" : "s"}`}
          action={
            isSuperAdmin && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus size={14} /> Add Admin
              </Button>
            )
          }
        />
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last Login</Th>
            </Tr>
          </Thead>
          <Tbody>
            {admins.length === 0 ? (
              <TableEmptyRow colSpan={5} message="No admin accounts found." />
            ) : (
              admins.map((admin) => (
                <Tr key={admin.id}>
                  <Td className="font-semibold text-navy-600">
                    {admin.fullName}
                    {admin.id === me.id && <span className="ml-1.5 text-xs text-navy-300">(you)</span>}
                  </Td>
                  <Td>{admin.email}</Td>
                  <Td>
                    {isSuperAdmin && admin.id !== me.id ? (
                      <Select
                        value={admin.role}
                        onChange={(e) => changeRole(admin, e.target.value as "SUPER_ADMIN" | "ADMIN")}
                        className="!w-auto py-1"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </Select>
                    ) : (
                      <RoleBadge role={admin.role} />
                    )}
                  </Td>
                  <Td>
                    <Badge variant={admin.isActive ? "success" : "danger"}>
                      {admin.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs">{formatDate(admin.lastLoginAt)}</span>
                      {isSuperAdmin && admin.id !== me.id && (
                        <Button
                          size="sm"
                          variant={admin.isActive ? "outline" : "primary"}
                          onClick={() => toggleActive(admin)}
                        >
                          {admin.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <ChangePasswordCard />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Admin Account" size="sm">
        <form className="space-y-3" onSubmit={handleAddAdmin}>
          <Input label="Full name" name="fullName" required />
          <Input label="Email address" name="email" type="email" required />
          <Input label="Temporary password" name="password" type="password" minLength={8} required />
          <Select label="Role" name="role" defaultValue="ADMIN">
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>
          <Button className="w-full" type="submit" loading={saving}>
            Create Account
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/admins/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to change password.");
        return;
      }
      toast.success("Password changed. Your other sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Network error changing password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader title="Change My Password" />
      <form className="space-y-3 p-4" onSubmit={handleSubmit}>
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="New password"
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={saving}>
          <KeyRound size={14} /> Update Password
        </Button>
      </form>
    </Card>
  );
}
