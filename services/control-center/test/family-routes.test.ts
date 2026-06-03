import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("family prototype routes", () => {
  it("returns the family presence overview", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/family" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      presentCount: 3,
      members: [
        {
          id: "mom",
          name: "Mom",
          relation: "Mom",
          presence: "home",
          lastActivity: "Mom arrived home.",
        },
        {
          id: "dad",
          name: "Dad",
          relation: "Dad",
          presence: "home",
          lastActivity: "Garage door closed.",
        },
        {
          id: "alex",
          name: "Alex",
          relation: "Alex",
          presence: "home",
          lastActivity: "Alex arrived home.",
        },
      ],
    });
  });

  it("records a family broadcast activity with the message text", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/family/broadcast",
      payload: { message: "Dinner is ready." },
    });
    const overview = await app.inject({ method: "GET", url: "/api/family" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "SUCCESS",
      activity: {
        type: "broadcast",
        message: "Dinner is ready.",
      },
    });
    expect(overview.json().activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "broadcast",
          message: "Dinner is ready.",
        }),
      ]),
    );
  });

  it("rejects invalid family broadcast payloads with a stable error code", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/family/broadcast",
      payload: { message: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "BROADCAST_INVALID" });
  });
});
