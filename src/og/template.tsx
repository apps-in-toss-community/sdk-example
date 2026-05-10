/**
 * Static OG image template (1200x630).
 *
 * Single source of truth for every PNG emitted to public/og/. Adapted from the
 * apps-in-toss-community homepage repo (src/og/template.tsx) so the family of
 * org-wide OG images shares one visual language; the only sdk-example-specific
 * tweak is the brand mark glyph ("SDK" instead of "AITC").
 *
 * satori only supports a subset of CSS — flex layout, no grid. Keep
 * positioning explicit (every node with multiple children has display: 'flex').
 */

interface OgTemplateProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
}

const COLORS = {
  bg: '#f4f5f7',
  brand: '#3182f6',
  fg: '#191f28',
  fgSoft: '#4e5968',
  fgMuted: '#8b95a1',
  white: '#ffffff',
};

export function OgTemplate({ eyebrow, title, subtitle, footer }: OgTemplateProps) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'row',
        background: COLORS.bg,
        padding: '96px',
        alignItems: 'center',
        gap: '44px',
        fontFamily: 'Pretendard',
      }}
    >
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: 56,
          background: COLORS.brand,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            color: COLORS.white,
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: '-3px',
          }}
        >
          SDK
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: COLORS.brand,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            color: COLORS.fg,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: '-2px',
            marginTop: 18,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: COLORS.fgSoft,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '-0.5px',
            marginTop: 22,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            color: COLORS.fgMuted,
            fontSize: 22,
            fontWeight: 500,
            marginTop: 28,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
