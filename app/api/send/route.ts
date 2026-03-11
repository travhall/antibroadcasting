import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    const { name, email, message, quantity, colors, garment, timeline } = body;

    const { data, error } = await resend.emails.send({
      from: "Quote Request <quotes@antibroadcasting.com>",
      to: ["info@antibroadcasting.com"],
      replyTo: email,
      subject: `New Quote Request from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Quantity: ${quantity ?? "Not specified"}
Colors: ${colors ?? "Not specified"}
Garment: ${garment ?? "Not specified"}
Timeline: ${timeline ?? "Not specified"}

Message:
${message}
      `.trim(),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
