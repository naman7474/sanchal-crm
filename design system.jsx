import { useState } from "react";

const COLORS = {
    // Primary - Deep Indigo (Trust, Authority, Insurance)
    primary: { 50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81' },
    // Secondary - Warm Amber (Action, Energy, Indian warmth)
    amber: { 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
    // Success - Emerald
    emerald: { 50: '#ECFDF5', 100: '#D1FAE5', 500: '#10B981', 600: '#059669', 700: '#047857' },
    // Danger - Rose
    rose: { 50: '#FFF1F2', 100: '#FFE4E6', 500: '#F43F5E', 600: '#E11D48', 700: '#BE123C' },
    // Warning - Orange
    orange: { 50: '#FFF7ED', 100: '#FFEDD5', 500: '#F97316', 600: '#EA580C' },
    // Neutral - Slate
    slate: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
};

const ColorSwatch = ({ name, hex, textDark = false }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: hex, border: '1px solid #E2E8F0', flexShrink: 0 }} />
        <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: "'DM Sans', sans-serif" }}>{name}</div>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "monospace" }}>{hex}</div>
        </div>
    </div>
);

const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: 24, marginTop: 48 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', fontFamily: "'DM Sans', sans-serif", margin: 0, letterSpacing: '-0.02em' }}>{children}</h2>
        {sub && <p style={{ fontSize: 15, color: '#64748B', marginTop: 6, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{sub}</p>}
        <div style={{ width: 48, height: 3, backgroundColor: '#6366F1', borderRadius: 2, marginTop: 12 }} />
    </div>
);

const Card = ({ children, style = {} }) => (
    <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, ...style }}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default' }) => {
    const styles = {
        default: { bg: '#EEF2FF', color: '#4F46E5' },
        success: { bg: '#ECFDF5', color: '#047857' },
        warning: { bg: '#FFF7ED', color: '#EA580C' },
        danger: { bg: '#FFF1F2', color: '#E11D48' },
        neutral: { bg: '#F1F5F9', color: '#475569' },
    };
    const s = styles[variant];
    return (
        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, backgroundColor: s.bg, color: s.color, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {children}
        </span>
    );
};

const StatCard = ({ label, value, change, icon, accent }) => (
    <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 24px', flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: 13, color: '#64748B', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>{value}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: accent || '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {icon}
            </div>
        </div>
        {change && (
            <div style={{ marginTop: 8, fontSize: 13, color: change.startsWith('+') ? '#059669' : '#E11D48', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {change} <span style={{ color: '#94A3B8', fontWeight: 400 }}>vs last month</span>
            </div>
        )}
    </div>
);

const TableRow = ({ data, isHeader = false }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr 0.8fr',
        padding: '12px 16px',
        backgroundColor: isHeader ? '#F8FAFC' : '#fff',
        borderBottom: '1px solid #F1F5F9',
        fontSize: isHeader ? 12 : 14,
        fontWeight: isHeader ? 600 : 400,
        color: isHeader ? '#64748B' : '#1E293B',
        fontFamily: "'DM Sans', sans-serif",
        textTransform: isHeader ? 'uppercase' : 'none',
        letterSpacing: isHeader ? '0.05em' : 'normal',
        alignItems: 'center',
    }}>
        {data.map((cell, i) => <div key={i}>{cell}</div>)}
    </div>
);

const NavItem = ({ icon, label, active = false }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10,
        backgroundColor: active ? '#EEF2FF' : 'transparent',
        color: active ? '#4F46E5' : '#64748B',
        fontWeight: active ? 600 : 500,
        fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
        transition: 'all 0.15s ease',
    }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {label}
    </div>
);

const Button = ({ children, variant = 'primary', size = 'md' }) => {
    const base = { border: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease' };
    const sizes = { sm: { fontSize: 13, padding: '6px 12px' }, md: { fontSize: 14, padding: '10px 20px' }, lg: { fontSize: 16, padding: '12px 28px' } };
    const variants = {
        primary: { backgroundColor: '#4F46E5', color: '#fff' },
        secondary: { backgroundColor: '#F1F5F9', color: '#334155' },
        success: { backgroundColor: '#059669', color: '#fff' },
        danger: { backgroundColor: '#FFF1F2', color: '#E11D48', border: '1px solid #FFE4E6' },
        ghost: { backgroundColor: 'transparent', color: '#4F46E5' },
        whatsapp: { backgroundColor: '#25D366', color: '#fff' },
    };
    return <button style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
};

const Input = ({ label, placeholder, type = 'text', required = false }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
        </label>
        <input type={type} placeholder={placeholder} style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", color: '#1E293B', outline: 'none', boxSizing: 'border-box',
            backgroundColor: '#fff', transition: 'border-color 0.15s ease',
        }} />
    </div>
);

const Select = ({ label, options, required }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
        </label>
        <select style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", color: '#1E293B', backgroundColor: '#fff', boxSizing: 'border-box',
        }}>
            {options.map(o => <option key={o}>{o}</option>)}
        </select>
    </div>
);

export default function KavachDesignSystem() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'colors', label: 'Colors' },
        { id: 'typography', label: 'Typography' },
        { id: 'components', label: 'Components' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'forms', label: 'Forms' },
        { id: 'mobile', label: 'Mobile' },
    ];

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ backgroundColor: '#0F172A', padding: '32px 40px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>K</div>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Kavach</span>
                    <span style={{ fontSize: 13, color: '#94A3B8', marginLeft: 4 }}>Design System v1.0</span>
                </div>
                <p style={{ color: '#94A3B8', fontSize: 15, margin: 0, marginTop: 8, maxWidth: 600, lineHeight: 1.5 }}>
                    Frontend design guide for the insurance agent portfolio manager. Built for simplicity — every screen should pass the "uncle test": can a 50-year-old insurance agent in Rohini use this without training?
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', backgroundColor: '#fff', padding: '0 40px', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '14px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                        fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400, fontFamily: "'DM Sans', sans-serif",
                        color: activeTab === tab.id ? '#4F46E5' : '#64748B',
                        borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
                        transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* Content */}
            <div style={{ padding: '24px 40px', maxWidth: 1100 }}>

                {/* ==================== OVERVIEW ==================== */}
                {activeTab === 'overview' && (
                    <div>
                        <SectionTitle sub="The core philosophy that drives every design decision in Kavach.">Design Principles</SectionTitle>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
                            {[
                                { num: '01', title: 'Uncle Test First', desc: 'Every screen must be usable by a 50-year-old insurance agent who only uses WhatsApp and Excel. No jargon, no hidden menus, no clever interactions. If it needs explanation, redesign it.', color: '#6366F1' },
                                { num: '02', title: 'One Primary Action', desc: 'Every screen has exactly ONE thing the user should do next. Make it obvious with size, color, and position. Secondary actions are muted. No decision paralysis.', color: '#F59E0B' },
                                { num: '03', title: 'Big Touch Targets', desc: 'Minimum 44px tap targets. Insurance agents use this on phones between client meetings. Fat fingers, bright sunlight, moving vehicles — design for the worst case.', color: '#10B981' },
                                { num: '04', title: 'Data Density Done Right', desc: 'Show the most important number LARGE. Supporting data stays small. Use color to encode urgency (red/orange/green) so agents can scan without reading.', color: '#F43F5E' },
                                { num: '05', title: 'WhatsApp-Native Patterns', desc: 'Our users live in WhatsApp. Use familiar patterns: chat-like activity logs, green action buttons, tap-to-call, share-ready cards. Reduce learning curve to zero.', color: '#25D366' },
                                { num: '06', title: 'Offline-Aware', desc: 'Show cached data when offline. Never show a blank screen. Indicate sync status subtly. The agent should never feel "the app is broken" just because they\'re in a basement.', color: '#64748B' },
                            ].map(p => (
                                <Card key={p.num} style={{ position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 48, fontWeight: 700, color: p.color, opacity: 0.08 }}>{p.num}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>{p.num}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{p.title}</div>
                                    <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{p.desc}</div>
                                </Card>
                            ))}
                        </div>

                        <SectionTitle sub="The aesthetic direction for Kavach.">Design Tone</SectionTitle>
                        <Card>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                <div>
                                    <h4 style={{ color: '#059669', margin: '0 0 12px', fontSize: 15 }}>✓ Kavach IS</h4>
                                    {['Clean & spacious — like a well-organized desk', 'Warm & trustworthy — like a senior colleague', 'Fast & responsive — like a calculator', 'Familiar — like WhatsApp meets Excel', 'Professional — like a bank app, not a game'].map(t => (
                                        <div key={t} style={{ padding: '8px 0', fontSize: 14, color: '#334155', borderBottom: '1px solid #F1F5F9', lineHeight: 1.5 }}>{t}</div>
                                    ))}
                                </div>
                                <div>
                                    <h4 style={{ color: '#E11D48', margin: '0 0 12px', fontSize: 15 }}>✗ Kavach is NOT</h4>
                                    {['Flashy or animated — no gradients, no bouncy transitions', 'Dense or overwhelming — no 20-column tables on mobile', 'Playful or gamified — no confetti, no streaks, no rewards', 'Dark-mode-first — agents work in daylight, outdoors', 'Generic SaaS — no blue-purple gradient hero sections'].map(t => (
                                        <div key={t} style={{ padding: '8px 0', fontSize: 14, color: '#334155', borderBottom: '1px solid #F1F5F9', lineHeight: 1.5 }}>{t}</div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <SectionTitle sub="Technical decisions for the frontend.">Tech Specs</SectionTitle>
                        <Card>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                                {[
                                    { label: 'Framework', value: 'Next.js 14+ (App Router)' },
                                    { label: 'Styling', value: 'Tailwind CSS v3' },
                                    { label: 'Components', value: 'shadcn/ui (Radix primitives)' },
                                    { label: 'Icons', value: 'Lucide React' },
                                    { label: 'Charts', value: 'Recharts' },
                                    { label: 'Font', value: 'DM Sans (Google Fonts)' },
                                    { label: 'State', value: 'TanStack Query + Zustand' },
                                    { label: 'Forms', value: 'React Hook Form + Zod' },
                                    { label: 'Breakpoints', value: '375 / 768 / 1024 / 1280' },
                                    { label: 'Min Target', value: '44×44px tap areas' },
                                    { label: 'Max Width', value: '1280px container' },
                                    { label: 'Border Radius', value: '8px small / 12px cards' },
                                ].map(s => (
                                    <div key={s.label}>
                                        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                                        <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* ==================== COLORS ==================== */}
                {activeTab === 'colors' && (
                    <div>
                        <SectionTitle sub="A restrained, professional palette. Indigo for trust, Amber for action, Emerald/Rose for status.">Color Palette</SectionTitle>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
                            <Card>
                                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#0F172A' }}>Primary — Indigo</h4>
                                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>Trust, authority, professionalism. Used for nav, buttons, links, active states. The "identity" color.</p>
                                <div style={{ display: 'flex', marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                                    {[COLORS.primary[100], COLORS.primary[300], COLORS.primary[500], COLORS.primary[700], COLORS.primary[900]].map((c, i) => (
                                        <div key={i} style={{ flex: 1, height: 48, backgroundColor: c }} />
                                    ))}
                                </div>
                                {Object.entries(COLORS.primary).map(([k, v]) => <ColorSwatch key={k} name={`Primary ${k}`} hex={v} />)}
                            </Card>

                            <Card>
                                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#0F172A' }}>Accent — Amber</h4>
                                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>Warmth, attention, urgency. Used for CTAs, warnings, highlights. Feels "Indian" — marigold energy.</p>
                                <div style={{ display: 'flex', marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                                    {[COLORS.amber[100], COLORS.amber[300], COLORS.amber[500], COLORS.amber[700]].map((c, i) => (
                                        <div key={i} style={{ flex: 1, height: 48, backgroundColor: c }} />
                                    ))}
                                </div>
                                {Object.entries(COLORS.amber).map(([k, v]) => <ColorSwatch key={k} name={`Amber ${k}`} hex={v} />)}
                            </Card>

                            <Card>
                                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#0F172A' }}>Semantic Colors</h4>
                                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>Status indicators. Agents scan by color — these must be consistent and distinct everywhere.</p>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                                    <div style={{ flex: 1, height: 48, backgroundColor: '#10B981', borderRadius: '8px 0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>Active</div>
                                    <div style={{ flex: 1, height: 48, backgroundColor: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>Warning</div>
                                    <div style={{ flex: 1, height: 48, backgroundColor: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>Expired</div>
                                    <div style={{ flex: 1, height: 48, backgroundColor: '#64748B', borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>Inactive</div>
                                </div>
                                <ColorSwatch name="Success / Renewed" hex="#10B981" />
                                <ColorSwatch name="Warning / Expiring" hex="#F97316" />
                                <ColorSwatch name="Danger / Expired" hex="#F43F5E" />
                                <ColorSwatch name="WhatsApp Green" hex="#25D366" />
                                <ColorSwatch name="Neutral / Inactive" hex="#64748B" />
                            </Card>
                        </div>

                        <SectionTitle sub="How colors are applied across the interface.">Usage Rules</SectionTitle>
                        <Card>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div>
                                    <h4 style={{ fontSize: 14, color: '#0F172A', margin: '0 0 12px' }}>Background Layers</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 60, height: 36, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }} />
                                            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Page Background</div><div style={{ fontSize: 12, color: '#94A3B8' }}>Slate 50 — #F8FAFC</div></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 60, height: 36, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6 }} />
                                            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Cards & Panels</div><div style={{ fontSize: 12, color: '#94A3B8' }}>White — #FFFFFF</div></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 60, height: 36, backgroundColor: '#0F172A', borderRadius: 6 }} />
                                            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Sidebar / Topbar</div><div style={{ fontSize: 12, color: '#94A3B8' }}>Slate 900 — #0F172A</div></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, color: '#0F172A', margin: '0 0 12px' }}>Color Rules</h4>
                                    {[
                                        'Never use more than 2 colors in a single card',
                                        'Status colors only for status — never decorative',
                                        'Amber only for primary CTA or attention items',
                                        'WhatsApp green ONLY for WhatsApp actions',
                                        'No gradients anywhere in the app',
                                        'Borders always Slate 200 (#E2E8F0)',
                                    ].map((r, i) => (
                                        <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#334155', borderBottom: '1px solid #F1F5F9' }}>{r}</div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ==================== TYPOGRAPHY ==================== */}
                {activeTab === 'typography' && (
                    <div>
                        <SectionTitle sub="DM Sans — a humanist sans-serif that's warm, readable, and professional. Supports Devanagari for future Hindi localization.">Typography</SectionTitle>

                        <Card style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type Scale</h4>
                            {[
                                { name: 'Page Title', size: 28, weight: 700, letter: '-0.02em', sample: 'Dashboard', color: '#0F172A', usage: 'One per page. Top-left.' },
                                { name: 'Section Heading', size: 20, weight: 600, letter: '-0.01em', sample: 'Expiring This Month', color: '#0F172A', usage: 'Card titles, section labels.' },
                                { name: 'Card Title', size: 16, weight: 600, letter: '0', sample: 'Total Policies', color: '#334155', usage: 'Stat labels, table headers.' },
                                { name: 'Body', size: 14, weight: 400, letter: '0', sample: 'Dharmender — 2W Package — Go Digit Insurance', color: '#334155', usage: 'Default text. Lists, descriptions.' },
                                { name: 'Body Bold', size: 14, weight: 600, letter: '0', sample: '₹4,57,733', color: '#0F172A', usage: 'Numbers, key values in tables.' },
                                { name: 'Small / Caption', size: 12, weight: 500, letter: '0.02em', sample: 'EXPIRES FEB 01, 2027', color: '#64748B', usage: 'Timestamps, secondary info, badges.' },
                                { name: 'Mono', size: 13, weight: 400, letter: '0.02em', sample: 'POL-D250305121', color: '#4F46E5', usage: 'Policy numbers, IDs. Use DM Mono.' },
                            ].map(t => (
                                <div key={t.name} style={{ display: 'flex', alignItems: 'baseline', gap: 20, padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                                    <div style={{ width: 140, flexShrink: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t.name}</div>
                                        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{t.size}px / {t.weight}</div>
                                    </div>
                                    <div style={{ flex: 1, fontSize: t.size, fontWeight: t.weight, color: t.color, letterSpacing: t.letter, fontFamily: t.name === 'Mono' ? "'DM Mono', monospace" : "'DM Sans', sans-serif" }}>
                                        {t.sample}
                                    </div>
                                    <div style={{ width: 200, fontSize: 12, color: '#94A3B8', flexShrink: 0 }}>{t.usage}</div>
                                </div>
                            ))}
                        </Card>

                        <Card>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Number Formatting Rules</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {[
                                    { label: 'Currency (Indian)', good: '₹4,57,733', bad: '457733 or $457,733', note: 'Always use ₹ with Indian comma format (X,XX,XXX)' },
                                    { label: 'Phone Numbers', good: '+91 98999-25956', bad: '989925956', note: 'Always show +91, group as XXXXX-XXXXX' },
                                    { label: 'Dates', good: '02 Feb 2026', bad: '2026-02-02 or 02/02/26', note: 'DD MMM YYYY — unambiguous, readable' },
                                    { label: 'Percentages', good: '42.5%', bad: '0.425', note: 'Always show % symbol, max 1 decimal' },
                                ].map(f => (
                                    <div key={f.label} style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>{f.label}</div>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✓ {f.good}</span>
                                            <span style={{ fontSize: 13, color: '#E11D48' }}>✗ {f.bad}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748B' }}>{f.note}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* ==================== COMPONENTS ==================== */}
                {activeTab === 'components' && (
                    <div>
                        <SectionTitle sub="Every reusable building block. Built on shadcn/ui with Kavach customizations.">Component Library</SectionTitle>

                        <Card style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buttons</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                                <Button variant="primary">+ Add Policy</Button>
                                <Button variant="secondary">Cancel</Button>
                                <Button variant="success">✓ Mark Renewed</Button>
                                <Button variant="danger">Delete</Button>
                                <Button variant="whatsapp">💬 WhatsApp</Button>
                                <Button variant="ghost">View All →</Button>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button size="sm">Small</Button>
                                <Button size="md">Medium</Button>
                                <Button size="lg">Large</Button>
                            </div>
                            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#FFF7ED', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                                <strong>Rule:</strong> Max 2 buttons side-by-side. Primary on left, secondary on right. WhatsApp button only where WhatsApp action is relevant.
                            </div>
                        </Card>

                        <Card style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Badges / Status Tags</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                <Badge variant="success">Active</Badge>
                                <Badge variant="success">Renewed</Badge>
                                <Badge variant="warning">Expiring Soon</Badge>
                                <Badge variant="danger">Expired</Badge>
                                <Badge variant="default">New Lead</Badge>
                                <Badge variant="neutral">Inactive</Badge>
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B' }}>
                                Badges use the semantic color system. Always pair with a text label — never use color alone to convey meaning.
                            </div>
                        </Card>

                        <Card style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stat Cards</h4>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <StatCard label="Total Policies" value="247" change="+12" icon="📋" accent="#EEF2FF" />
                                <StatCard label="This Month Revenue" value="₹2.4L" change="+18%" icon="💰" accent="#ECFDF5" />
                                <StatCard label="Expiring in 30 Days" value="14" change="" icon="⏰" accent="#FFF7ED" />
                                <StatCard label="Pending Follow-ups" value="6" icon="📞" accent="#FFF1F2" />
                            </div>
                            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#EEF2FF', borderRadius: 8, fontSize: 13, color: '#3730A3' }}>
                                <strong>Rule:</strong> Max 4 stat cards per row on desktop, 2 on tablet, 1 on mobile. The number should be 2-3× larger than the label.
                            </div>
                        </Card>

                        <Card style={{ marginBottom: 24 }}>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Table (Expiring Policies)</h4>
                            <div style={{ borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                <TableRow isHeader data={['Customer', 'Product', 'Company', 'End Date', 'Premium', 'Status']} />
                                <TableRow data={['Dharmender', '2W Package', 'Go Digit', '01 Feb 2027', '₹1,099', <Badge variant="success">Active</Badge>]} />
                                <TableRow data={['Mukesh Devi', 'Health', 'Reliance', '01 Feb 2027', '₹36,148', <Badge variant="success">Active</Badge>]} />
                                <TableRow data={['Preeti', 'PVT CAR TP', 'Zurich Kotak', '03 Feb 2027', '₹3,416', <Badge variant="warning">Expiring</Badge>]} />
                                <TableRow data={['Sarfu Din', 'PVT CAR Pkg', 'Shriram', '03 Feb 2027', '₹5,757', <Badge variant="danger">Expired</Badge>]} />
                            </div>
                            <div style={{ marginTop: 16, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                                <strong>Table rules:</strong> Alternating row colors are NOT used (too noisy). Hover state shows light Slate-50 background. Click on any row opens the detail. Mobile: table collapses to card view (see Mobile tab).
                            </div>
                        </Card>

                        <Card>
                            <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation Sidebar</h4>
                            <div style={{ display: 'flex', gap: 24 }}>
                                <div style={{ width: 220, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 8px' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>K</div>
                                        <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Kavach</span>
                                    </div>
                                    <NavItem icon="📊" label="Dashboard" active />
                                    <NavItem icon="👥" label="Customers" />
                                    <NavItem icon="📋" label="Policies" />
                                    <NavItem icon="🎯" label="Leads" />
                                    <NavItem icon="📈" label="Reports" />
                                    <NavItem icon="📁" label="Documents" />
                                    <div style={{ height: 1, backgroundColor: '#E2E8F0', margin: '12px 0' }} />
                                    <NavItem icon="⚙️" label="Settings" />
                                </div>
                                <div style={{ flex: 1, fontSize: 13, color: '#64748B', lineHeight: 1.8 }}>
                                    <strong style={{ color: '#0F172A' }}>Sidebar Rules:</strong><br />
                                    — Max 7 nav items (6 main + settings)<br />
                                    — Icons are emoji for now, replace with Lucide in prod<br />
                                    — Active state: Indigo-50 bg + Indigo-600 text<br />
                                    — On mobile: sidebar becomes bottom tab bar with 5 items<br />
                                    — Collapse to icons-only on tablet (768-1024px)<br />
                                    — No nested menus — ever. Reports sub-pages accessible from the Reports page itself.
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ==================== DASHBOARD ==================== */}
                {activeTab === 'dashboard' && (
                    <div>
                        <SectionTitle sub="The first screen after login. Answers: 'What do I need to do today?'">Dashboard Layout</SectionTitle>

                        {/* Mock Dashboard */}
                        <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            {/* Top bar */}
                            <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>Good morning, Rajesh 👋</div>
                                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Saturday, 28 Feb 2026 — You have <strong style={{ color: '#EA580C' }}>3 policies expiring this week</strong></div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}>🔍</div>
                                    <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', position: 'relative' }}>
                                        🔔
                                        <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, backgroundColor: '#F43F5E', borderRadius: '50%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ padding: '20px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <StatCard label="Active Policies" value="247" change="+12" icon="📋" accent="#EEF2FF" />
                                <StatCard label="This Month Premium" value="₹4.8L" change="+23%" icon="💰" accent="#ECFDF5" />
                                <StatCard label="Commission Earned" value="₹48.2K" change="+8%" icon="📊" accent="#FFFBEB" />
                                <StatCard label="Expiring (30 days)" value="14" icon="⚠️" accent="#FFF7ED" />
                            </div>

                            {/* Two columns */}
                            <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                                {/* Expiring Policies Alert */}
                                <Card>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>⏰ Expiring This Week</h3>
                                        <Button variant="ghost" size="sm">View All →</Button>
                                    </div>
                                    {[
                                        { name: 'Dharmender', product: '2W Package', date: 'Tomorrow', urgency: 'danger' },
                                        { name: 'Preeti', product: 'PVT CAR TP', date: 'In 3 days', urgency: 'warning' },
                                        { name: 'Sarfu Din', product: 'PVT CAR Pkg', date: 'In 5 days', urgency: 'warning' },
                                    ].map((p, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                                                <div style={{ fontSize: 13, color: '#64748B' }}>{p.product}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Badge variant={p.urgency}>{p.date}</Badge>
                                                <Button variant="whatsapp" size="sm">💬</Button>
                                            </div>
                                        </div>
                                    ))}
                                </Card>

                                {/* Quick Actions + Follow-ups */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <Card>
                                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Quick Actions</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Button variant="primary" size="md">+ New Policy</Button>
                                            <Button variant="secondary" size="md">+ Add Customer</Button>
                                            <Button variant="secondary" size="md">+ New Lead</Button>
                                        </div>
                                    </Card>
                                    <Card>
                                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0F172A' }}>📞 Today's Follow-ups</h3>
                                        {[
                                            { name: 'Ravi Kumar', note: 'Quote for car insurance' },
                                            { name: 'Sunita Devi', note: 'Health policy renewal' },
                                        ].map((f, i) => (
                                            <div key={i} style={{ padding: '8px 0', borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none' }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{f.name}</div>
                                                <div style={{ fontSize: 12, color: '#94A3B8' }}>{f.note}</div>
                                            </div>
                                        ))}
                                    </Card>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#EEF2FF', borderRadius: 8, fontSize: 13, color: '#3730A3', lineHeight: 1.6 }}>
                            <strong>Layout Rules:</strong> Greeting + date + alert count at top. 4 stat cards in a row. Below: 2-column layout — wide left (alerts, tables), narrow right (quick actions, follow-ups). On mobile: single column, stats become 2×2 grid, quick actions move to floating action button (FAB).
                        </div>
                    </div>
                )}

                {/* ==================== FORMS ==================== */}
                {activeTab === 'forms' && (
                    <div>
                        <SectionTitle sub="Forms should feel like filling a simple register — not a tax return.">Form Design</SectionTitle>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <Card>
                                <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Add New Customer</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <Input label="Customer Name" placeholder="e.g. Dharmender Singh" required />
                                    </div>
                                    <Input label="Mobile Number" placeholder="+91 98999-25956" required type="tel" />
                                    <Input label="Email" placeholder="optional" type="email" />
                                    <Select label="ID Type" options={['Select...', 'Aadhaar', 'PAN Card', 'Driving License', 'Passport']} />
                                    <Input label="ID Number" placeholder="XXXX-XXXX-XXXX" />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <Input label="Address" placeholder="Full address" />
                                    </div>
                                    <Select label="Source" options={['Select...', 'Referral', 'Walk-in', 'Phone Inquiry', 'Online']} />
                                    <Input label="Referred By" placeholder="Referrer name" />
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                    <Button variant="primary">Save Customer</Button>
                                    <Button variant="secondary">Cancel</Button>
                                </div>
                            </Card>

                            <Card>
                                <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Add New Policy</h4>
                                <Select label="Customer" options={['Search customer...', 'Dharmender', 'Mukesh Devi', 'Preeti']} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                    <Select label="Product" options={['Select...', '2W', 'PVT CAR', 'COMMERCIAL', 'HEALTH', 'LIFE', 'TRAVEL']} required />
                                    <Input label="Vehicle Number" placeholder="HR51BR9537" />
                                    <Select label="Policy Type" options={['Select...', 'PACKAGE', 'TP (Third Party)', 'MEDICLAIM', 'TERM']} required />
                                    <Input label="Insurance Company" placeholder="Go Digit, Reliance..." required />
                                    <Input label="Policy Number" placeholder="D250305121" />
                                    <Input label="Agent" placeholder="Direct / Agent name" />
                                    <Input label="Start Date" type="date" required />
                                    <Input label="End Date" type="date" required />
                                </div>
                                <div style={{ padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, marginBottom: 16, marginTop: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Commission Calculator</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                        <Input label="Net/OD Premium" placeholder="₹0" type="number" />
                                        <Input label="Commission %" placeholder="0.0%" type="number" />
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 13 }}>
                                        <span style={{ color: '#64748B' }}>Before TDS: <strong style={{ color: '#0F172A' }}>₹467.08</strong></span>
                                        <span style={{ color: '#64748B' }}>TDS: <strong style={{ color: '#E11D48' }}>₹9.34</strong></span>
                                        <span style={{ color: '#64748B' }}>Net: <strong style={{ color: '#059669' }}>₹457.73</strong></span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <Button variant="primary">Save Policy</Button>
                                    <Button variant="secondary">Cancel</Button>
                                </div>
                            </Card>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <Card>
                                <h4 style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Form Design Rules</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                                    <div>
                                        <strong>Layout</strong>
                                        <div style={{ marginTop: 4 }}>— 2-column grid on desktop, single column on mobile</div>
                                        <div>— Full-width fields for names and addresses</div>
                                        <div>— Related fields grouped visually (dates together, money together)</div>
                                        <div>— Commission section in a shaded box to feel like a "calculator"</div>
                                        <div>— Max 10-12 visible fields. Use progressive disclosure for rare fields</div>
                                    </div>
                                    <div>
                                        <strong>Behavior</strong>
                                        <div style={{ marginTop: 4 }}>— Auto-calculate commission fields in real-time as agent types</div>
                                        <div>— Show/hide Vehicle Number based on Product (only for motor)</div>
                                        <div>— Customer search: typeahead with phone number + name</div>
                                        <div>— Date picker: tap-friendly, default today for entry date</div>
                                        <div>— Save button disabled until required fields filled</div>
                                        <div>— Success toast after save: "Policy saved ✓" — auto-dismiss 3s</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ==================== MOBILE ==================== */}
                {activeTab === 'mobile' && (
                    <div>
                        <SectionTitle sub="70%+ usage will be on mobile. Every feature must work on a 375px screen with one thumb.">Mobile Design</SectionTitle>

                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            {/* Phone mockup - Dashboard */}
                            <div style={{ width: 320, flexShrink: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>📱 Mobile Dashboard</div>
                                <div style={{ width: 320, backgroundColor: '#F8FAFC', borderRadius: 24, border: '3px solid #1E293B', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                                    {/* Status bar */}
                                    <div style={{ backgroundColor: '#0F172A', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                                        <span>9:41</span>
                                        <span>●●● ▐█▌ 87%</span>
                                    </div>
                                    {/* App header */}
                                    <div style={{ backgroundColor: '#fff', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>K</div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Hi, Rajesh 👋</div>
                                                <div style={{ fontSize: 11, color: '#EA580C', fontWeight: 500 }}>3 policies expiring soon</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔍</div>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, position: 'relative' }}>
                                                🔔<div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, backgroundColor: '#F43F5E', borderRadius: '50%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stats row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 12px' }}>
                                        {[
                                            { l: 'Policies', v: '247', c: '#4F46E5' },
                                            { l: 'Expiring', v: '14', c: '#EA580C' },
                                            { l: 'Commission', v: '₹48K', c: '#059669' },
                                            { l: 'Leads', v: '6', c: '#F59E0B' },
                                        ].map(s => (
                                            <div key={s.l} style={{ backgroundColor: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{s.l}</div>
                                                <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Expiring list */}
                                    <div style={{ padding: '0 12px 12px' }}>
                                        <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                            <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>⏰ Expiring Soon</span>
                                                <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 500 }}>See all</span>
                                            </div>
                                            {[
                                                { n: 'Dharmender', p: '2W · Go Digit', d: 'Tomorrow', u: 'danger' },
                                                { n: 'Preeti', p: 'Car · Zurich Kotak', d: '3 days', u: 'warning' },
                                                { n: 'Sarfu Din', p: 'Car · Shriram', d: '5 days', u: 'warning' },
                                            ].map((item, i) => (
                                                <div key={i} style={{ padding: '10px 14px', borderBottom: i < 2 ? '1px solid #F8FAFC' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.n}</div>
                                                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{item.p}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Badge variant={item.u}>{item.d}</Badge>
                                                        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>💬</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Bottom nav */}
                                    <div style={{ backgroundColor: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px' }}>
                                        {[
                                            { icon: '📊', label: 'Home', active: true },
                                            { icon: '👥', label: 'Clients', active: false },
                                            { icon: '➕', label: '', active: false, fab: true },
                                            { icon: '🎯', label: 'Leads', active: false },
                                            { icon: '📈', label: 'Reports', active: false },
                                        ].map(n => (
                                            <div key={n.label || 'fab'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                {n.fab ? (
                                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, marginTop: -12, boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>+</div>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: 18 }}>{n.icon}</span>
                                                        <span style={{ fontSize: 10, color: n.active ? '#4F46E5' : '#94A3B8', fontWeight: n.active ? 600 : 400 }}>{n.label}</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile design rules */}
                            <div style={{ flex: 1, minWidth: 300 }}>
                                <Card style={{ marginBottom: 20 }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Mobile Navigation Pattern</h4>
                                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
                                        <strong>Bottom Tab Bar</strong> with 5 items: Home, Clients, [FAB +], Leads, Reports<br />
                                        <strong>Floating Action Button (FAB)</strong> — center position, raised, indigo gradient. Tap opens a quick-add sheet: "New Policy", "New Customer", "New Lead"<br />
                                        <strong>No hamburger menu.</strong> Everything reachable within 2 taps from the bottom bar.<br />
                                        <strong>No sidebar on mobile.</strong> Settings accessible from profile avatar in top-right.<br />
                                        <strong>Swipe gestures:</strong> Swipe left on policy row → Call / WhatsApp actions. Swipe right → Mark as renewed.
                                    </div>
                                </Card>

                                <Card style={{ marginBottom: 20 }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Table → Card Transformation</h4>
                                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
                                        On mobile, data tables transform into stacked cards. Each card shows:<br />
                                        — <strong>Line 1:</strong> Customer name (bold, 15px) + Status badge<br />
                                        — <strong>Line 2:</strong> Product · Company (13px, grey)<br />
                                        — <strong>Line 3:</strong> Expiry date + Premium amount (13px)<br />
                                        — <strong>Right edge:</strong> WhatsApp quick-action button
                                    </div>
                                    {/* Example card */}
                                    <div style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #F97316' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Preeti</span>
                                                    <Badge variant="warning">Expiring</Badge>
                                                </div>
                                                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>PVT CAR · TP · Zurich Kotak</div>
                                                <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                                                    Expires: <strong>03 Feb 2027</strong> · Premium: <strong>₹3,416</strong>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>💬</div>
                                                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📞</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>↑ Mobile card with left border colored by urgency (orange = expiring soon)</div>
                                </Card>

                                <Card>
                                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Mobile Spacing & Sizing</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                                        {[
                                            { label: 'Page padding', value: '16px' },
                                            { label: 'Card padding', value: '14-16px' },
                                            { label: 'Card gap', value: '8-12px' },
                                            { label: 'Min tap target', value: '44 × 44px' },
                                            { label: 'Bottom bar height', value: '64px' },
                                            { label: 'FAB size', value: '48 × 48px' },
                                            { label: 'Font min', value: '13px body' },
                                            { label: 'Safe area', value: 'env(safe-area-inset-*)' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: 6 }}>
                                                <div style={{ color: '#94A3B8', fontSize: 11 }}>{s.label}</div>
                                                <div style={{ color: '#0F172A', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}