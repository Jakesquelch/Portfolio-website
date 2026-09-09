/**
 * How a phone on mobile data reaches a server sitting behind the home router's
 * NAT — the mechanism described in the Tailscale section of
 * `content/posts/homelabbing.mdx`.
 *
 * The point the drawing has to carry is that neither device ever accepts an
 * inbound connection: both dial *out* to the coordination server (dashed,
 * muted), and that handshake is what lets the direct WireGuard tunnel (solid,
 * accent) cross the NAT boundary without a port being forwarded. So the two
 * line treatments are load-bearing, not decoration.
 *
 * Colours are the palette's CSS custom properties rather than Tailwind
 * classes, so the whole drawing — arrowheads included — follows the theme
 * toggle for free. `currentColor` is deliberately avoided: it does not
 * inherit across the marker boundary consistently between browsers, which
 * would leave the arrowheads stuck on one theme's colour.
 *
 * There are two layouts because SVG coordinates cannot reflow: a landscape one
 * for md and up, and a portrait one below it that stacks the three nodes and
 * runs the tunnel down the left margin as a side channel. Scaling the
 * landscape drawing down to phone width instead would put its 10px labels
 * around 6px. The nodes and boundaries are shared components so only the
 * geometry is written twice.
 */

type NodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Small mono kicker above the title, e.g. the vendor name. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

/** A titled box. Text is centred on the box rather than positioned by hand. */
function Node({ x, y, width, height, eyebrow, title, subtitle }: NodeProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="10"
        fill="var(--background)"
        stroke="var(--line)"
      />
      {eyebrow && (
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="font-mono"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--muted-foreground)"
        >
          {eyebrow}
        </text>
      )}
      <text
        x={cx}
        y={eyebrow ? cy + 12 : subtitle ? cy - 6 : cy + 5}
        textAnchor="middle"
        className="font-sans"
        fontSize="14"
        fill="var(--foreground)"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          className="font-sans"
          fontSize="11.5"
          fill="var(--muted-foreground)"
        >
          {subtitle}
        </text>
      )}
    </>
  );
}

type BoundaryProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  labelSize?: number;
  labelSpacing?: string;
};

/** The dashed NAT boundary, labelled from its top-left corner. */
function Boundary({
  x,
  y,
  width,
  height,
  label,
  labelSize = 10,
  labelSpacing = "0.1em",
}: BoundaryProps) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="12"
        fill="none"
        stroke="var(--line)"
        strokeDasharray="5 5"
      />
      <text
        x={x + 16}
        y={y + 21}
        className="font-mono"
        fontSize={labelSize}
        letterSpacing={labelSpacing}
        fill="var(--muted-foreground)"
      >
        {label}
      </text>
    </>
  );
}

/**
 * Arrowheads. Both layouts sit in the DOM at once, so the marker ids have to
 * be scoped per layout — duplicate ids would let a `url(#…)` in the visible
 * SVG resolve against the hidden one.
 */
function Arrowheads({ prefix }: { prefix: string }) {
  const heads: [string, string][] = [
    ["muted", "var(--muted-foreground)"],
    ["accent", "var(--accent)"],
  ];

  return (
    <defs>
      {heads.map(([name, fill]) => (
        <marker
          key={name}
          id={`${prefix}-arrow-${name}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={fill} />
        </marker>
      ))}
    </defs>
  );
}

/** md and up: coordination server on top, the two peers side by side. */
function WideLayout() {
  return (
    <svg viewBox="0 0 600 380" aria-hidden="true" className="w-full">
      <Arrowheads prefix="tailnet-wide" />

      <Node
        x={185}
        y={16}
        width={230}
        height={58}
        eyebrow="TAILSCALE"
        title="Coordination server"
      />

      <Boundary
        x={330}
        y={212}
        width={250}
        height={150}
        label="HOME LAN · BEHIND NAT"
      />
      <Node
        x={352}
        y={250}
        width={206}
        height={90}
        title="My Server"
        subtitle="Immich in Docker"
      />

      <Node
        x={20}
        y={250}
        width={150}
        height={76}
        title="My phone"
        subtitle="on mobile data"
      />

      {/* Both devices dial out — this is the part NAT allows. The server's
          curve leaves from the right of its box to clear the LAN label. */}
      <path
        d="M 95 246 Q 95 130 178 68"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        markerEnd="url(#tailnet-wide-arrow-muted)"
      />
      <text
        x="120"
        y="170"
        className="font-mono"
        fontSize="10.5"
        fill="var(--muted-foreground)"
      >
        outbound
      </text>
      <path
        d="M 536 246 Q 536 120 420 70"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        markerEnd="url(#tailnet-wide-arrow-muted)"
      />
      <text
        x="510"
        y="176"
        textAnchor="end"
        className="font-mono"
        fontSize="10.5"
        fill="var(--muted-foreground)"
      >
        outbound
      </text>

      {/* ...and the tunnel that buys you, straight through the NAT. */}
      <line
        x1="176"
        y1="302"
        x2="346"
        y2="302"
        stroke="var(--accent)"
        strokeWidth="2"
        markerStart="url(#tailnet-wide-arrow-accent)"
        markerEnd="url(#tailnet-wide-arrow-accent)"
      />
      <text
        x="261"
        y="291"
        textAnchor="middle"
        className="font-mono"
        fontSize="11"
        fill="var(--accent)"
      >
        WireGuard tunnel
      </text>
      <text
        x="261"
        y="320"
        textAnchor="middle"
        className="font-mono"
        fontSize="10"
        fill="var(--muted-foreground)"
      >
        direct, encrypted
      </text>
    </svg>
  );
}

/**
 * Below md: the same three nodes stacked, with the tunnel routed down the left
 * margin so it visibly bypasses the coordination server and crosses the dashed
 * boundary on its way into the server box. The two outbound lines sit at ±50
 * either side of the centre line so they stay clear of the LAN label.
 */
function TallLayout() {
  return (
    <svg
      viewBox="0 0 320 500"
      aria-hidden="true"
      className="mx-auto w-full max-w-[340px]"
    >
      <Arrowheads prefix="tailnet-tall" />

      <Node
        x={68}
        y={12}
        width={200}
        height={62}
        title="My phone"
        subtitle="on mobile data"
      />

      <path
        d="M 118 78 V 176"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        markerEnd="url(#tailnet-tall-arrow-muted)"
      />
      <text
        x="128"
        y="132"
        className="font-mono"
        fontSize="10"
        fill="var(--muted-foreground)"
      >
        outbound
      </text>

      <Node
        x={68}
        y={180}
        width={200}
        height={62}
        eyebrow="TAILSCALE"
        title="Coordination server"
      />

      <path
        d="M 218 364 V 248"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        markerEnd="url(#tailnet-tall-arrow-muted)"
      />
      <text
        x="208"
        y="300"
        textAnchor="end"
        className="font-mono"
        fontSize="10"
        fill="var(--muted-foreground)"
      >
        outbound
      </text>

      <Boundary
        x={44}
        y={330}
        width={264}
        height={155}
        label="HOME LAN · BEHIND NAT"
        labelSize={9.5}
        labelSpacing="0.08em"
      />
      <Node
        x={60}
        y={368}
        width={232}
        height={90}
        title="My Server"
        subtitle="Immich in Docker"
      />

      {/* The side channel: out of the phone, down the margin, back in through
          the dashed boundary — never touching the coordination server. */}
      <path
        d="M 64 43 H 32 Q 18 43 18 57 V 398 Q 18 412 32 412 H 56"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        markerStart="url(#tailnet-tall-arrow-accent)"
        markerEnd="url(#tailnet-tall-arrow-accent)"
      />
      <text
        transform="rotate(-90 34 230)"
        x="34"
        y="230"
        textAnchor="middle"
        className="font-mono"
        fontSize="10.5"
        fill="var(--accent)"
      >
        WireGuard tunnel
      </text>
    </svg>
  );
}

export function TailnetDiagram() {
  return (
    <figure className="my-8">
      <div className="rounded-xl border border-line bg-surface p-4">
        {/* Both layouts are in the DOM, so the SVGs are hidden from assistive
            tech and the description below is announced once either way. */}
        <div className="hidden md:block">
          <WideLayout />
        </div>
        <div className="md:hidden">
          <TallLayout />
        </div>
        <p className="sr-only">
          A phone on mobile data and a server inside the home LAN each make an
          outbound connection to Tailscale&rsquo;s coordination server. Once
          coordinated, the two devices talk to each other directly over an
          encrypted WireGuard tunnel that crosses the home router&rsquo;s NAT,
          with no port forwarded.
        </p>
      </div>
      <figcaption className="mt-3 text-sm/relaxed text-muted-foreground">
        Both devices make outbound connections to the coordination server, which
        is what lets them then talk directly - no port forwarded on the router.
      </figcaption>
    </figure>
  );
}
