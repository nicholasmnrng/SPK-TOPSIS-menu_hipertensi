import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
const email = `ahli-gizi-e2e-${Date.now()}@example.test`;
const password = "AhliGizi123!";

function cookieHeader(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  return values
    .filter(Boolean)
    .map((value) => value.split(";")[0])
    .join("; ");
}

async function jsonRequest(path: string, body: unknown, cookie?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const register = await jsonRequest("/api/register", { name: "Ahli Gizi E2E", email, password });
  assert(register.status === 201, `Registrasi gagal: ${register.status} ${await register.text()}`);
  const registered = await prisma.user.findUniqueOrThrow({ where: { email } });
  assert(registered.status === "ACTIVE" && registered.role === "USER", "Registrasi tidak menghasilkan USER/ACTIVE.");

  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminLogin = await jsonRequest("/api/auth/sign-in/email", {
    email: admin.email,
    password: adminPassword,
  });
  assert(adminLogin.ok, `Login Admin gagal: ${adminLogin.status} ${await adminLogin.text()}`);
  const adminCookie = cookieHeader(adminLogin);
  assert(adminCookie, "Cookie sesi Admin tidak diterbitkan.");

  const userLogin = await jsonRequest("/api/auth/sign-in/email", { email, password });
  assert(userLogin.ok, `Login User gagal: ${userLogin.status} ${await userLogin.text()}`);
  const userCookie = cookieHeader(userLogin);

  const foods = await fetch(`${baseUrl}/foods`, { headers: { Cookie: userCookie }, redirect: "manual" });
  assert(foods.status === 200 && (await foods.text()).includes("Data Makanan"), "User tidak dapat membuka Data Makanan.");
  const userAccounts = await fetch(`${baseUrl}/accounts`, { headers: { Cookie: userCookie }, redirect: "manual" });
  assert(userAccounts.status >= 300 && userAccounts.status < 400, "User seharusnya dialihkan dari manajemen akun.");
  const adminFoods = await fetch(`${baseUrl}/foods`, { headers: { Cookie: adminCookie }, redirect: "manual" });
  assert(adminFoods.status >= 300 && adminFoods.status < 400, "Admin seharusnya dialihkan dari Data Makanan.");

  const pdf = await fetch(`${baseUrl}/api/reports/rankings.pdf`, { headers: { Cookie: userCookie } });
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  assert(pdf.ok && pdfBytes.subarray(0, 4).toString() === "%PDF", "Download PDF tidak valid.");

  const xlsx = await fetch(`${baseUrl}/api/reports/rankings.xlsx`, { headers: { Cookie: userCookie } });
  const xlsxBytes = Buffer.from(await xlsx.arrayBuffer());
  assert(xlsx.ok && xlsxBytes.subarray(0, 2).toString() === "PK", "Download XLSX tidak valid.");

  console.log(JSON.stringify({
    registration: "USER/ACTIVE",
    activeLogin: userLogin.status,
    userFoods: foods.status,
    userAccounts: userAccounts.status,
    adminFoods: adminFoods.status,
    pdfBytes: pdfBytes.length,
    xlsxBytes: xlsxBytes.length,
  }));
}

main()
  .finally(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.account.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.updateMany({ where: { actorId: user.id }, data: { actorId: null } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
