import { describe, expect, it } from "vitest";
import { apiInject, buildApp } from "./helpers/build-test-app";

describe("camera prototype routes", () => {
  it("returns prototype camera descriptors", async () => {
    const app = buildApp();
    const response = await apiInject(app, { method: "GET", url: "/api/cameras" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      cameras: [
        {
          id: "entry-camera",
          name: "Entry Camera",
          location: "Front Door",
          online: true,
          recording: true,
        },
        {
          id: "garden-camera",
          name: "Garden Camera",
          location: "Back Yard",
          online: true,
          recording: false,
        },
      ],
    });
  });

  it("updates entry camera recording state", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "PATCH",
      url: "/api/cameras/entry-camera",
      payload: { recording: false },
    });
    const list = await apiInject(app, { method: "GET", url: "/api/cameras" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      camera: { id: "entry-camera", recording: false },
    });
    expect(
      list.json().cameras.find((camera: { id: string }) => camera.id === "entry-camera")
        .recording,
    ).toBe(false);
  });

  it("reports unknown cameras with a stable error code", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "PATCH",
      url: "/api/cameras/missing-camera",
      payload: { recording: false },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ code: "CAMERA_NOT_FOUND" });
  });

  it("rejects invalid camera update payloads with a stable error code", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "PATCH",
      url: "/api/cameras/entry-camera",
      payload: { recording: "false" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR", fields: expect.any(Array) });
  });
});
