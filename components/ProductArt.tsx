// Drawn product pictures, used until a real photo is uploaded. Colours are checked against a strict pattern
// before they are placed into SVG text, so a bad value can never inject markup.
const HEX = /^#[0-9a-fA-F]{6}$/;
const col = (v: string | undefined, fallback: string) => (v && HEX.test(v) ? v : fallback);

export function artSvg(kind: string, art: string[]): string {
  const c = [col(art[0], "#ffffff"), col(art[1], "#111111"), col(art[2], "#111111")];
  if (kind === "shoe") {
    return `<svg viewBox="0 0 300 170" aria-hidden="true">
<ellipse cx="152" cy="156" rx="124" ry="7" fill="rgba(0,0,0,.14)"/>
<path d="M40 126 C36 92 46 66 72 62 L104 64 C114 56 130 44 150 40 C160 40 166 46 170 54 C184 76 214 84 244 92 C266 98 276 108 276 126 Z" fill="${c[0]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M104 64 C118 58 134 48 150 42 C152 58 142 72 126 80 C116 76 108 70 104 64 Z" fill="#111" opacity=".85"/><path d="M72 62 L104 64 L100 76 L70 74 Z" fill="#111" opacity=".85"/>
<path d="M84 114 C128 112 182 98 232 102" stroke="${c[1]}" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M140 62 L156 70 M150 54 L166 66 M130 70 L146 78" stroke="#111" stroke-width="3" stroke-linecap="round" opacity=".7"/>
<path d="M32 122 L276 122 C284 124 284 136 278 144 C272 152 262 154 250 154 L58 154 C42 154 30 148 30 136 Z" fill="${c[2]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M44 140 L262 140" stroke="#fff" stroke-width="3" opacity=".5" stroke-dasharray="2 8" stroke-linecap="round"/></svg>`;
  }
  const body: Record<string, string> = {
    shorts: `<path d="M70 50 L230 50 L240 140 L165 140 L150 98 L135 140 L60 140 Z" fill="${c[0]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><rect x="70" y="50" width="160" height="12" fill="${c[1]}" stroke="#111" stroke-width="2.5"/>`,
    singlet: `<path d="M105 30 L128 30 C132 52 168 52 172 30 L195 30 L206 70 L196 78 L198 150 L102 150 L104 78 L94 70 Z" fill="${c[0]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><path d="M128 30 C132 52 168 52 172 30" fill="none" stroke="${c[1]}" stroke-width="5"/>`,
    jacket: `<path d="M100 30 L128 24 L150 44 L172 24 L200 30 L246 66 L236 130 L214 126 L214 160 L86 160 L86 126 L64 130 L54 66 Z" fill="${c[0]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><path d="M150 44 L150 160" stroke="${c[1]}" stroke-width="5"/><path d="M58 76 L92 86 M242 76 L208 86" stroke="${c[1]}" stroke-width="8"/>`,
    tee: `<path d="M102 30 L130 26 C134 46 166 46 170 26 L198 30 L246 62 L228 94 L204 82 L204 150 L96 150 L96 82 L72 94 L54 62 Z" fill="${c[0]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><rect x="134" y="82" width="32" height="14" rx="3" fill="${c[1]}"/>`,
    tights: `<path d="M92 24 L208 24 L214 70 L196 160 L158 160 L150 84 L142 160 L104 160 L86 70 Z" fill="${c[0]}" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><rect x="92" y="24" width="116" height="12" fill="${c[1]}"/>`,
  };
  return `<svg viewBox="0 0 300 180" aria-hidden="true">${body[kind] ?? body.tee}</svg>`;
}

export function ProductArt({ kind, art }: { kind: string; art: string[] }) {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: artSvg(kind, art) }} />;
}

/** Real photo if there is one, otherwise the drawing. */
export function ProductImage({ imageUrl, kind, art, alt }: { imageUrl: string | null; kind: string; art: string[]; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (imageUrl) return <img src={imageUrl} alt={alt} loading="lazy" />;
  return <ProductArt kind={kind} art={art} />;
}
