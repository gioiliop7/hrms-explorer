import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ENTITY_TYPE_MAP } from "@/lib/utils";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org");

    let orgName = "The Greek Extended Registry";
    let subTitle = "Πύλη Δημοσίου Τομέα";
    let type = "Δημόσιος Φορέας";

    if (orgId) {
      try {
        const response = await fetch(
          `https://hrgov.gioiliop.eu/api/organizations/${orgId}`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.data?.preferredLabel) {
            orgName = data.data.preferredLabel;
            subTitle = `${orgId}`; // Κρατάμε μόνο τον κωδικό εδώ
            type =
              ENTITY_TYPE_MAP[data.data.organizationType] || "Δημόσιος Φορέας";
          }
        } else {
          console.error("API Error:", response.status);
        }
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#013475",
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.2) 0%, transparent 50%)",
            padding: "60px 80px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >

          {/* Header: Logo & Domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "16px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                display: "flex",
              }}
            >
              <img
                src="https://hrgov.gioiliop.eu/logo.png"
                width="50"
                height="50"
                alt="Logo"
              />
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#fff",
                fontWeight: "600",
                letterSpacing: "0.5px",
                opacity: 0.9,
              }}
            >
              hrgov.gioiliop.eu
            </div>
          </div>

          {/* Main Content: Organization Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: "90%",
              zIndex: 10,
            }}
          >
            <h1
              style={{
                fontSize: orgName.length > 40 ? 56 : 72, // Μικρότερη γραμματοσειρά για μεγάλα ονόματα
                fontWeight: "800",
                color: "#fff",
                lineHeight: 1.1,
                margin: 0,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {orgName}
            </h1>
          </div>

          {/* Footer: Details (ID & Type) */}
          <div style={{ display: "flex", gap: "40px", zIndex: 10 }}>
            {/* Κωδικός Φορέα */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "600",
                }}
              >
                Κωδικός Φορέα
              </span>
              <span
                style={{
                  fontSize: 32,
                  color: "#fff",
                  fontWeight: "700",
                  marginTop: "4px",
                }}
              >
                {subTitle}
              </span>
            </div>

            {/* Διαχωριστική γραμμή */}
            <div
              style={{
                width: "1px",
                height: "50px",
                background: "rgba(255,255,255,0.2)",
              }}
            ></div>

            {/* Τύπος Φορέα */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "600",
                }}
              >
                Τύπος Φορέα
              </span>
              <span
                style={{
                  fontSize: 32,
                  color: "#fff",
                  fontWeight: "700",
                  marginTop: "4px",
                }}
              >
                {type}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`OG Error: ${e.message}`);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}
