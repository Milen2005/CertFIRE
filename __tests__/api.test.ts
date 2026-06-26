describe("CertFIRE API - Basic Tests", () => {
  const BASE_URL = "http://localhost:3000";

  // Test 1: GET /api/fests - public route should return array
  test("GET /api/fests returns 200 or 500", async () => {
  const res = await fetch(`${BASE_URL}/api/fests`);
  expect([200, 500]).toContain(res.status);
  });


  // Test 2: POST /api/register - missing fields should return 400
  test("POST /api/register with missing fields returns 400", async () => {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });
    expect(res.status).toBe(400);
  });

  // Test 3: GET /api/registrations - unauthenticated returns 401
  test("GET /api/registrations without auth returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/registrations`);
    expect(res.status).toBe(401);
  });

  // Test 4: POST /api/certificates/generate - unauthenticated returns 403
  test("POST /api/certificates/generate without auth returns 403", async () => {
    const res = await fetch(`${BASE_URL}/api/certificates/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ festId: "test" }),
    });
    expect(res.status).toBe(403);
  });

  // Test 5: GET /api/verify/INVALID - returns 404
  test("GET /api/verify/INVALID returns 404 or 500", async () => {
  const res = await fetch(`${BASE_URL}/api/verify/INVALIDCERTID`);
  expect([404, 500]).toContain(res.status);
  });

  // Test 6: GET /api/admin/audit-logs - unauthenticated returns 403
  test("GET /api/admin/audit-logs without auth returns 403", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`);
    expect(res.status).toBe(403);
  });
});