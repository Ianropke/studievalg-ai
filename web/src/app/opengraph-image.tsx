import { ImageResponse } from "next/og";

export const alt = "Uddannelsesindsigt — find uddannelse efter snit, job og AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #12172B 0%, #1E3A5F 58%, #0B7A57 100%)",
          color: "white",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
              color: "#12172B",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            U
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>Uddannelsesindsigt</span>
            <span style={{ marginTop: 4, fontSize: 18, color: "#DDE7F2" }}>Uafhængig beslutningsstøtte</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <span style={{ fontSize: 66, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
            Find uddannelse efter snit, job og AI
          </span>
          <span style={{ marginTop: 26, fontSize: 25, lineHeight: 1.4, color: "#E6EEF7" }}>
            Sammenlign 1.413 danske videregående uddannelser med officielle optagelsestal og tydeligt markerede modelestimater.
          </span>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 18, fontWeight: 700 }}>
          {['Adgangskvotient', 'Jobmuligheder', 'Lønpotentiale', 'AI-robusthed'].map((label) => (
            <span key={label} style={{ padding: "10px 16px", borderRadius: 999, background: "rgba(255,255,255,0.14)" }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    ),
    size
  );
}
