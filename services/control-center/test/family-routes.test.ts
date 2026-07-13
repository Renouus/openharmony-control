import { describe, expect, it } from "vitest";
import { apiInject, buildApp } from "./helpers/build-test-app";

describe("family prototype routes", () => {
  it("returns the family presence overview", async () => {
    const app = buildApp();
    const response = await apiInject(app, { method: "GET", url: "/api/family" });

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
    const response = await apiInject(app, {
      method: "POST",
      url: "/api/family/broadcast",
      payload: { message: "Dinner is ready." },
    });
    const overview = await apiInject(app, { method: "GET", url: "/api/family" });

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
    const response = await apiInject(app, {
      method: "POST",
      url: "/api/family/broadcast",
      payload: { message: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR", fields: expect.any(Array) });
    expect(response.json()).not.toHaveProperty("stack");
  });

  it("returns family settings and persists updates", async () => {
    const app = buildApp();

    const getBefore = await apiInject(app, {
      method: "GET",
      url: "/api/family/settings",
    });

    expect(getBefore.statusCode).toBe(200);
    expect(getBefore.json()).toMatchObject({
      homeName: expect.any(String),
      address: expect.any(String),
      timezone: expect.any(String),
      emergencyContactName: expect.any(String),
      emergencyContactPhone: expect.any(String),
    });

    const updateResponse = await apiInject(app, {
      method: "PUT",
      url: "/api/family/settings",
      payload: {
        homeName: "My Home",
        address: "Shanghai Demo Road 88",
        timezone: "Asia/Shanghai",
        emergencyContactName: "Li Lei",
        emergencyContactPhone: "13800000000",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      homeName: "My Home",
      address: "Shanghai Demo Road 88",
      timezone: "Asia/Shanghai",
      emergencyContactName: "Li Lei",
      emergencyContactPhone: "13800000000",
    });

    const getAfter = await apiInject(app, {
      method: "GET",
      url: "/api/family/settings",
    });

    expect(getAfter.statusCode).toBe(200);
    expect(getAfter.json()).toMatchObject({
      homeName: "My Home",
      address: "Shanghai Demo Road 88",
      timezone: "Asia/Shanghai",
      emergencyContactName: "Li Lei",
      emergencyContactPhone: "13800000000",
    });
  });
});
