import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/rbac/permissions";

describe("two-role RBAC", () => {
  it("keeps Admin focused on accounts and monitoring", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("ADMIN", "monitoring:read")).toBe(true);
    expect(hasPermission("ADMIN", "foods:manage")).toBe(false);
    expect(hasPermission("ADMIN", "criteria:manage")).toBe(false);
  });

  it("allows Ahli Gizi to operate data but not administration", () => {
    expect(hasPermission("USER", "foods:manage")).toBe(true);
    expect(hasPermission("USER", "criteria:manage")).toBe(true);
    expect(hasPermission("USER", "reports:export")).toBe(true);
    expect(hasPermission("USER", "users:manage")).toBe(false);
    expect(hasPermission("USER", "audit:read")).toBe(false);
  });
});
