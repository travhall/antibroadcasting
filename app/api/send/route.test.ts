import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const { POST } = await import("./route");

function makeRequest(body: unknown, ip: string) {
  return new NextRequest("http://localhost/api/send", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  name: "Test User",
  email: "test@example.com",
  message: "Hi, please quote this job.",
  quantity: 50,
};

afterEach(() => {
  sendMock.mockReset();
});

describe("POST /api/send", () => {
  it("sends the email and returns 200 for a valid payload", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    const res = await POST(makeRequest(validPayload, "1.1.1.1"));

    expect(res.status).toBe(200);
    // Business notification + customer confirmation.
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("sends a branded HTML notification with a plain-text fallback", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "abc" }, error: null });

    await POST(makeRequest(validPayload, "8.8.8.8"));

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Test User"),
        text: expect.stringContaining("Test User"),
      }),
    );
  });

  it("returns a generic error and does not leak Resend's internal error details when the send fails", async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: "some internal Resend detail", name: "validation_error" },
    });

    const res = await POST(makeRequest(validPayload, "2.2.2.2"));
    const body = await res.json();
    const bodyText = JSON.stringify(body);

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to send email" });
    expect(bodyText).not.toContain("some internal Resend detail");
    expect(bodyText).not.toContain("validation_error");
  });

  it("returns 400 for a missing required field", async () => {
    const res = await POST(
      makeRequest({ ...validPayload, name: "" }, "3.3.3.3"),
    );

    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rate limits after 5 requests from the same IP", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    const ip = "4.4.4.4";

    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(validPayload, ip));
      expect(res.status).toBe(200);
    }

    const res = await POST(makeRequest(validPayload, ip));
    expect(res.status).toBe(429);
  });

  it("forwards a valid attachment to resend.emails.send", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "abc" }, error: null });
    const attachments = [
      { filename: "art.png", content: "aGVsbG8=", contentType: "image/png" },
    ];

    const res = await POST(
      makeRequest({ ...validPayload, attachments }, "5.5.5.5"),
    );

    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ attachments }),
    );
  });

  it("accepts null for unselected optional Select fields (colors/garment/timeline)", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    const res = await POST(
      makeRequest(
        { ...validPayload, colors: null, garment: null, timeline: null },
        "7.7.7.7",
      ),
    );

    expect(res.status).toBe(200);
    // Business notification + customer confirmation.
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("returns 400 when attachments exceed the combined size limit", async () => {
    const oversizedContent = "a".repeat(30 * 1024 * 1024); // decodes to ~22.5MB, over the 20MB cap
    const attachments = [
      { filename: "huge.png", content: oversizedContent, contentType: "image/png" },
    ];

    const res = await POST(
      makeRequest({ ...validPayload, attachments }, "6.6.6.6"),
    );

    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("also sends a confirmation email to the customer", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    await POST(makeRequest(validPayload, "9.9.9.9"));

    expect(sendMock).toHaveBeenCalledTimes(2);
    const confirmationCall = sendMock.mock.calls.find(
      (call) => call[0].to === validPayload.email,
    );
    expect(confirmationCall).toBeDefined();
    expect(confirmationCall![0]).toMatchObject({
      to: validPayload.email,
      html: expect.stringContaining("Test User"),
    });
  });

  it("still returns 200 to the customer even if the confirmation email fails to send", async () => {
    sendMock
      .mockResolvedValueOnce({ data: { id: "abc" }, error: null }) // business notification
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } }); // confirmation

    const res = await POST(makeRequest(validPayload, "10.10.10.10"));

    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("does not attempt the confirmation email if the business notification fails", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const res = await POST(makeRequest(validPayload, "11.11.11.11"));

    expect(res.status).toBe(500);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
