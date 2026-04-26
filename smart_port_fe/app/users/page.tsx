"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { allAssignableRoles, ApiError, type UserCreateRequest, type UserRecord, type UserRole, usersApi } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { Button, Card, Chip, Input, Label, TextField } from "@heroui/react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type EditableUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

const roleLabelMap: Record<UserRole, string> = {
  shipping_agent: "Shipping Agent",
  berth_planner: "Berth Planner",
  finance_officer: "Finance Officer",
  operations_staff: "Operations Staff",
  admin: "Admin",
};

function formatRole(role: UserRole): string {
  return roleLabelMap[role];
}

function initialCreateForm(): UserCreateRequest {
  return {
    name: "",
    email: "",
    role: "operations_staff",
    password: "",
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<UserCreateRequest>(initialCreateForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<EditableUser | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const sessionUser = useMemo(() => getSessionUser(), []);
  const isAdmin = sessionUser?.role === "admin";

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const records = await usersApi.getAll();
      setUsers(records);
      if (records.length > 0 && !editForm) {
        const first = records[0];
        setEditForm({
          id: first.id,
          name: first.name,
          email: first.email,
          role: first.role,
          password: "",
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Unable to load users");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateMessage(null);
    setError(null);
    setCreateLoading(true);

    try {
      const created = await usersApi.create(createForm);
      setUsers((prev) => [created, ...prev]);
      setCreateForm(initialCreateForm());
      setCreateMessage(`User ${created.name} created successfully.`);

      if (!editForm) {
        setEditForm({
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          password: "",
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Create failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Create failed");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const onUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) return;

    setUpdateMessage(null);
    setError(null);
    setUpdateLoading(true);

    try {
      const updated = await usersApi.update(editForm.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        password: editForm.password || undefined,
      });

      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
      setEditForm((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              email: updated.email,
              role: updated.role,
              password: "",
            }
          : prev,
      );
      setUpdateMessage(`User ${updated.name} updated successfully.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Update failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Update failed");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const selectUser = (user: UserRecord) => {
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setUpdateMessage(null);
  };

  return (
    <DashboardLayout defaultActiveKey="users" pageTitle="Users">
      <section className="space-y-6">
        <header className="rounded-2xl border border-divider bg-linear-to-r from-content2 via-content1 to-success/5 p-5 md:p-6">
          <h2 className="text-2xl font-semibold">User Administration</h2>
          <p className="mt-1 text-sm text-default-500">
            Create and update users from this screen. Public registration is limited to shipping
            agents.
          </p>
        </header>

        {!isAdmin ? (
          <Card>
            <Card.Content className="space-y-2">
              <p className="text-lg font-semibold">Admin Access Required</p>
              <p className="text-sm text-default-500">
                Only users with Admin role can create or update users from this dashboard screen.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger-700">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <Card.Header>
                  <Card.Title>Create User</Card.Title>
                  <Card.Description>Use this form for internal roles management.</Card.Description>
                </Card.Header>
                <Card.Content>
                 <form className="space-y-4" aria-label="create user form" onSubmit={onCreateSubmit}>
                  {/* Full Name */}
                  <div className="space-y-1">
                    <TextField isRequired>
                      <Label htmlFor="create-name" className="block text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="create-name"
                        type="text"
                        value={createForm.name}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Enter full name"
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
                      />
                    </TextField>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <TextField isRequired>
                      <Label htmlFor="create-email" className="block text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={createForm.email}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        placeholder="you@company.com"
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
                      />
                    </TextField>
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <Label htmlFor="create-role" className="block text-sm font-medium">
                      Role
                    </Label>
                    <select
                      id="create-role"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                      value={createForm.role}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          role: event.target.value as UserRole,
                        }))
                      }
                    >
                      {allAssignableRoles
                        .filter((role) => role !== "shipping_agent")
                        .map((role) => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <TextField isRequired>
                      <Label htmlFor="create-password" className="block text-sm font-medium">
                        Password
                      </Label>
                      <Input
                        id="create-password"
                        type="password"
                        value={createForm.password}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        placeholder="Create a password"
                        minLength={6}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
                      />
                    </TextField>
                  </div>

                  {/* Message */}
                  {createMessage && <p className="text-sm text-success">{createMessage}</p>}

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    isPending={createLoading}
                  >
                    Create User
                  </Button>
                </form>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Update User</Card.Title>
                  <Card.Description>Select a user and update account details.</Card.Description>
                </Card.Header>
                <Card.Content>
                  {editForm ? (
                    <form className="space-y-4" aria-label="update user form" onSubmit={onUpdateSubmit}>
                      {/* Select User */}
                      <div className="space-y-1">
                        <Label htmlFor="edit-user-select" className="block text-sm font-medium">
                          Select User
                        </Label>
                        <select
                          id="edit-user-select"
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                          value={editForm.id}
                          onChange={(event) => {
                            const next = users.find((item) => item.id === Number(event.target.value));
                            if (next) selectUser(next);
                          }}
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({formatRole(user.role)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1">
                        <TextField isRequired>
                          <Label htmlFor="edit-name" className="block text-sm font-medium">
                            Full Name
                          </Label>
                          <Input
                            id="edit-name"
                            type="text"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, name: event.target.value } : prev
                              )
                            }
                            placeholder="Enter full name"
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
                          />
                        </TextField>
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <TextField isRequired>
                          <Label htmlFor="edit-email" className="block text-sm font-medium">
                            Email
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editForm.email}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, email: event.target.value } : prev
                              )
                            }
                            placeholder="you@company.com"
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
                          />
                        </TextField>
                      </div>

                      {/* Role */}
                      <div className="space-y-1">
                        <Label htmlFor="edit-role" className="block text-sm font-medium">
                          Role
                        </Label>
                        <select
                          id="edit-role"
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                          value={editForm.role}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, role: event.target.value as UserRole } : prev
                            )
                          }
                        >
                          {allAssignableRoles.map((role) => (
                            <option key={role} value={role}>
                              {formatRole(role)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <TextField>
                          <Label htmlFor="edit-password" className="block text-sm font-medium">
                            Reset Password (Optional)
                          </Label>
                          <Input
                            id="edit-password"
                            type="password"
                            value={editForm.password}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, password: event.target.value } : prev
                              )
                            }
                            placeholder="Enter new password (optional)"
                            minLength={6}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
                          />
                        </TextField>
                      </div>

                      {/* Message */}
                      {updateMessage && <p className="text-sm text-success">{updateMessage}</p>}

                      {/* Submit */}
                      <Button
                        type="submit"
                        className="w-full rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        isPending={updateLoading}
                      >
                        Update User
                      </Button>
                    </form>
                  ) : (
                    <p className="text-sm text-default-500">No users available to edit yet.</p>
                  )}
                </Card.Content>
              </Card>
            </div>

            <Card>
              <Card.Header className="flex items-center justify-between">
                <div>
                  <Card.Title>Users Directory</Card.Title>
                  <Card.Description>Current accounts and role assignment.</Card.Description>
                </div>
                <Button size="sm" variant="secondary" onPress={loadUsers} isPending={loading}>
                  Refresh
                </Button>
              </Card.Header>
              <Card.Content className="space-y-3">
                {loading && users.length === 0 && <p className="text-sm text-default-500">Loading users...</p>}

                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-xl border border-divider bg-content2/40 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-default-500">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="soft" color={user.role === "admin" ? "warning" : "accent"}>
                          {formatRole(user.role)}
                        </Chip>
                        <span className="text-xs text-default-500">ID: {user.id}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onPress={() => selectUser(user)}>
                      Edit in Update Form
                    </Button>
                  </div>
                ))}
              </Card.Content>
            </Card>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}

