'use client'
import React, { useState } from 'react'
import dynamic from 'next/dynamic'

const YesNoSim       = dynamic(() => import('./components/YesNoSim'),       { ssr: false })
const MultiOutcomeSim = dynamic(() => import('./components/MultiOutcomeSim'), { ssr: false })
const AccuracySim    = dynamic(() => import('./components/AccuracySim'),    { ssr: false })

type MarketTab = 'yesno' | 'multi' | 'accuracy'

const TABS: { id: MarketTab; label: string; color: string; sub: string; tag: string }[] = [
  { id: 'yesno',    label: 'Binary (Yes/No)',  color: 'var(--green)',  tag: 'Variable stakes',
    sub: 'Bet any amount. Winners split loser pool proportional to their net stake share.' },
  { id: 'multi',    label: 'Multi-outcome',    color: 'var(--amber)',  tag: 'Variable stakes',
    sub: 'Bet any amount on any outcome (2–4). Winning outcome splits all losing pools proportionally.' },
  { id: 'accuracy', label: 'Accuracy',         color: 'var(--purple)', tag: 'Fixed tiers only',
    sub: 'Fixed entry fee per tier ($1/$10/$100). Pure skill — stake size has no effect on payout share.' },
]

export default function Page() {
  const [tab, setTab] = useState<MarketTab>('yesno')
  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="min-h-screen" style={{ background: 'var(--black)', color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.97)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--white)', letterSpacing: -1 }}>
              CYPER<span style={{ color: 'var(--green)' }}>.</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)', letterSpacing: '0.1em' }}>MARKET MATH SIMULATOR</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>
              All math = exact port of <span style={{ color: 'var(--green)' }}>circuits.rs</span>
            </span>
            <a href="/site" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, padding: '6px 14px', border: '1px solid #222', color: '#b0ada6', textDecoration: 'none' }}>
              ← Full site
            </a>
          </div>
        </div>
      </div>

      {/* Explainer banner */}
      <div style={{ background: 'var(--gray)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px]">
            <div>
              <div style={{ color: 'var(--green)', marginBottom: 4 }}>// binary &amp; multi-outcome</div>
              <div style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                <strong style={{color:'var(--white)'}}>Variable stakes.</strong> Bet $5, $50, $500 — any amount.
                Bigger stake = bigger proportional share of the loser pool.
                Losers pay winners. Same formula for both market types.
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--purple)', marginBottom: 4 }}>// accuracy market</div>
              <div style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                <strong style={{color:'var(--white)'}}>Fixed tiers only.</strong> $1 / $10 / $100 per lobby.
                Everyone pays the same — pure prediction skill wins.
                Stake size has zero effect. Closer prediction = bigger weight.
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--amber)', marginBottom: 4 }}>// fees</div>
              <div style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                Binary/Multi: LP fee (1.5%) + Protocol fee (0.5%) on <strong style={{color:'var(--white)'}}>total pool</strong>.<br />
                Accuracy: Platform fee (20%) on <strong style={{color:'var(--white)'}}>loser pool only</strong> (per image).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Market type tabs */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: 'var(--text2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            // select market type
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '16px 20px', textAlign: 'left',
                  background: tab === t.id ? 'var(--gray2)' : 'var(--gray)',
                  border: `1px solid ${tab === t.id ? t.color : 'var(--border)'}`,
                  borderTop: tab === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: tab === t.id ? t.color : 'var(--text2)', fontSize: 12, fontWeight: 500 }}>
                    {t.label}
                  </span>
                  <span style={{
                    fontSize: 9, padding: '1px 6px', fontFamily: 'IBM Plex Mono, monospace',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: tab === t.id ? `${t.color}22` : 'var(--gray3)',
                    color: tab === t.id ? t.color : 'var(--text2)',
                    border: `1px solid ${tab === t.id ? t.color : 'transparent'}`,
                  }}>{t.tag}</span>
                </div>
                <div style={{ color: 'var(--text2)', fontSize: 10, lineHeight: 1.5 }}>{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Active tab content */}
        <div style={{ background: 'var(--gray)', border: '1px solid var(--border)', padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 4, height: 32, background: active.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: -0.5 }}>
                {active.label} Market Simulator
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{active.sub}</div>
            </div>
          </div>

          {tab === 'yesno'    && <YesNoSim />}
          {tab === 'multi'    && <MultiOutcomeSim />}
          {tab === 'accuracy' && <AccuracySim />}
        </div>

        {/* How to read the table */}
        <div style={{ marginTop: 32, background: 'var(--gray)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ fontSize: 10, color: 'var(--text2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
            // how to read the results
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
            <div>
              <div style={{ color: 'var(--white)', marginBottom: 4 }}>Stake (net)</div>
              <div style={{ color: 'var(--text2)', lineHeight: 1.6 }}>Stake after proportional fee deduction. This is what enters the pool and what gets returned to winners.</div>
            </div>
            <div>
              <div style={{ color: 'var(--white)', marginBottom: 4 }}>Payout</div>
              <div style={{ color: 'var(--text2)', lineHeight: 1.6 }}>Total USDC received at claim. Includes stake_net back + share of loser pool. Losers receive $0.</div>
            </div>
            <div>
              <div style={{ color: 'var(--white)', marginBottom: 4 }}>Profit / Loss</div>
              <div style={{ color: 'var(--text2)', lineHeight: 1.6 }}>Payout minus original stake. Losers show full stake as loss (red). Winners show net gain (green).</div>
            </div>
            <div>
              <div style={{ color: 'var(--white)', marginBottom: 4 }}>ROI</div>
              <div style={{ color: 'var(--text2)', lineHeight: 1.6 }}>(Profit / stake) × 100. Losers = −100%. Winners depend on pool composition and (for accuracy) prediction accuracy.</div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 10, color: 'var(--text2)' }}>
          Math is an exact TypeScript port of <span style={{ color: 'var(--green)' }}>circuits.rs</span> — same algorithm, same integer arithmetic, same bigint weight calculations.
          All values update live as you edit.
        </div>
      </div>
    </div>
  )
}
