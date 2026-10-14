export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      role,
      employees,
      marketplaces,
      message,
      preferredTime,
    } = body;

    if (!email || !firstName) {
      return NextResponse.json(
        { error: "İsim ve e-posta zorunludur." },
        { status: 400 }
      );
    }

    // Try to notify admin via email
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@pazaryonetimi.com",
        subject: `🎯 Yeni Demo Talebi: ${firstName} ${lastName || ""} (${company || "Bireysel"})`,
        html: `
          <h2>Yeni Demo Talebi Alındı</h2>
          <p><strong>Ad Soyad:</strong> ${firstName} ${lastName || ""}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone || "Belirtilmedi"}</p>
          <p><strong>Şirket:</strong> ${company || "Belirtilmedi"}</p>
          <p><strong>Rol / Pozisyon:</strong> ${role || "Belirtilmedi"}</p>
          <p><strong>Çalışan Sayısı:</strong> ${employees || "Belirtilmedi"}</p>
          <p><strong>Pazaryerleri:</strong> ${(marketplaces || []).join(", ") || "Belirtilmedi"}</p>
          <p><strong>Tercih Edilen Zaman:</strong> ${preferredTime || "Belirtilmedi"}</p>
          <p><strong>Not:</strong> ${message || "Yok"}</p>
        `,
      });
    } catch (mailErr) {
      console.warn("[DEMO_REQUEST] Could not send admin notification email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Demo talebiniz başarıyla iletildi.",
    });
  } catch (error: any) {
    console.error("[DEMO_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "Demo talebi işlenirken bir sorun oluştu." },
      { status: 500 }
    );
  }
}
