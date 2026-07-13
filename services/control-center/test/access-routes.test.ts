import { describe, expect, it } from "vitest";
import { buildApp } from "./helpers/build-test-app";

describe("access prototype routes", () => {
  it("returns front door access overview", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/access" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      primary: {
        id: "front-door",
        name: "Front Door",
        locked: true,
        battery: 85,
      },
      keys: [
        { holder: "Mom", status: "active" },
        { holder: "Dad", status: "active" },
        { holder: "Alex", status: "temporary" },
      ],
      accessPoints: [
        { id: "garage", name: "Garage" },
        { id: "back-door", name: "Back Door" },
      ],
    });
  });

  it("creates a temporary guest key for the share guest action", async () => {
    const app = buildApp();
    const start = Date.now();
    const response = await app.inject({
      method: "POST",
      url: "/api/access/guest-keys",
      payload: { holder: "Guest", hours: 4 },
    });
    const end = Date.now();

    expect(response.statusCode).toBe(201);
    const { key } = response.json();
    expect(key).toMatchObject({
      holder: "Guest",
      role: "Guest Access",
      status: "temporary",
    });
    expect(key.id).toMatch(/^guest-/);
    expect(new Date(key.expiresAt).getTime()).toBeGreaterThanOrEqual(
      start + 4 * 60 * 60 * 1000,
    );
    expect(new Date(key.expiresAt).getTime()).toBeLessThanOrEqual(
      end + 4 * 60 * 60 * 1000,
    );
  });

  it("rejects invalid guest key payloads with a stable error code", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/access/guest-keys",
      payload: { holder: "", hours: 0 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "GUEST_KEY_INVALID" });
  });

  it("rejects guest keys with an overflowing expiry", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/access/guest-keys",
      payload: { holder: "Guest", hours: 1e308 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "GUEST_KEY_INVALID" });
  });

  it("trims guest key holder names before returning the key", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/access/guest-keys",
      payload: { holder: "  Guest  ", hours: 4 },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().key.holder).toBe("Guest");
  });

  it("returns the new guest key in the next access overview refresh", async () => {
    const app = buildApp();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/access/guest-keys",
      payload: { holder: "Guest", hours: 4 },
    });

    expect(createResponse.statusCode).toBe(201);

    const overviewResponse = await app.inject({ method: "GET", url: "/api/access" });
    expect(overviewResponse.statusCode).toBe(200);
    expect(overviewResponse.json().keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          holder: "Guest",
          role: "Guest Access",
          status: "temporary",
        }),
      ]),
    );
  });
});
