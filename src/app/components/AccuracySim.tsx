'use client'
import React, { useState, useCallback } from 'react'
import { settleAccuracy, toRaw, fmtU, AccuracyTrader } from '../lib/math'
import { MetricCard, SliderRow, Divider, WinBadge, Card, SectionLabel } from './ui'

// Accuracy market — FIXED entry fee per tier
// Everyone in the same lobby pays the same amount
// This is what makes it a pure skill competition — no stake size advantage
const TIERS = [
  { label: '$1 lobby',   fee: 1 },
  { label: '$10 lobby',  fee: 10 },
  { label: '$100 lobby', fee: 100 },
]

const makeDefault = (fee: number): AccuracyTrader[] => [
  { name: 'P1',  stake: toRaw(fee), prediction: 99980 },
  { name: 'P2',  stake: toRaw(fee), prediction: 99900 },
  { name: 'P3',  stake: toRaw(fee), prediction: 99750 },
  { name: 'P4',  stake: toRaw(fee), prediction: 99600 },
  { name: 'P5',  stake: toRaw(fee), prediction: 99520 },
  { name: 'P6',  stake: toRaw(fee), prediction: 99500 },
  { name: 'P7',  stake: toRaw(fee), prediction: 99300 },
  { name: 'P8',  stake: toRaw(fee), prediction: 99000 },
  { name: 'P9',  stake: toRaw(fee), prediction: 98000 },
  { name: 'P10', stake: toRaw(fee), prediction: 95000 },
]

export default function AccuracySim() {
  const [tierIdx, setTierIdx]       = useState(1) // $10 default
  const [traders, setTraders]       = useState<AccuracyTrader[]>(makeDefault(10))
  const [actualValue, setActual]    = useState(100000)   // × 1000 → $100.000
  const [protoBps, setProtoBps]     = useState(2000)     // 20% of loser pool (from your image)
  const [decayExp, setDecayExp]     = useState(6)

  const tier = TIERS[tierIdx]
  // In accuracy, fee is taken from loser pool, NOT from total pool
  // Protocol_fee = loser_pool × protoBps/10000
  // This is different from Yes/No where fee is on total pool

  // Run settlement — all traders have same stake = tier.fee
  const result = settleAccuracy(traders, actualValue, 0, 0, decayExp)
  // We compute loser pool fee separately as per your image (20% of loser pool)
  const loserPoolRaw = result.loserPool
  const platformFee = Math.floor(loserPoolRaw * protoBps / 10000)
  const prizePool = loserPoolRaw - platformFee

  // Recalculate payouts with prize pool after platform cut
  const tradersFinal = result.traders.map(t => {
    if (!t.won) return t
    const share = result.winnerCount > 0 && t.weightPct > 0
      ? Math.floor((t.weightPct / 100) * prizePool) : 0
    const payout = t.stakeNet + share
    return { ...t, payout, profit: payout - t.stake, roi: ((payout - t.stake) / t.stake) * 100 }
  })

  const changeTier = (idx: number) => {
    setTierIdx(idx)
    const fee = TIERS[idx].fee
    setTraders(prev => prev.map(t => ({ ...t, stake: toRaw(fee) })))
  }

  const update = useCallback((i: number, field: string, val: number | string) => {
    setTraders(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }, [])

  const addTrader = () => setTraders(prev => [
    ...prev, { name: `P${prev.length+1}`, stake: toRaw(tier.fee), prediction: actualValue }
  ])
  const removeTrader = (i: number) => setTraders(prev => prev.filter((_,idx) => idx !== i))

  const displayVal = (v: number) => (v / 1000).toFixed(3)
  const n = traders.length
  const totalPool = n * toRaw(tier.fee)

  return (
    <div>
      {/* Design note */}
      <div style={{background:'rgba(123,92,250,0.06)',border:'1px solid rgba(123,92,250,0.2)',padding:'12px 16px',marginBottom:20,fontSize:12,lineHeight:1.6,color:'#b8b4ac'}}>
        <span style={{color:'#7b5cfa',fontWeight:600}}>Fixed entry fee per tier. Pure skill. </span>
        Everyone in the same lobby pays exactly the same amount ($1, $10, or $100).
        Your stake does NOT affect your share — only prediction accuracy does.
        Losers (error ≥ median) fund the prize pool. Winners split it by accuracy weight.
        Winners also get their entry fee back.
        <br /><span style={{color:'#6a6860'}}>Platform fee = {(protoBps/100).toFixed(0)}% of loser pool (not total pool — from your image).</span>
      </div>

      {/* Tier selector */}
      <div className="mb-6">
        <div className="text-[10px] mb-3" style={{color:'#6a6860',textTransform:'uppercase',letterSpacing:'0.1em'}}>// Select tier lobby (fixed entry fee)</div>
        <div className="flex gap-2">
          {TIERS.map((t, i) => (
            <button key={i} onClick={() => changeTier(i)}
              className="flex-1 py-3 text-[12px] border transition-all"
              style={{
                borderColor: tierIdx===i ? '#7b5cfa' : '#222',
                color: tierIdx===i ? '#7b5cfa' : '#6a6860',
                background: tierIdx===i ? 'rgba(123,92,250,0.1)' : 'transparent',
                fontFamily: 'IBM Plex Mono, monospace'
              }}>
              <div style={{fontSize:20,fontWeight:700,color:tierIdx===i?'#f0ece4':'#444',marginBottom:2}}>
                {t.label.split(' ')[0]}
              </div>
              <div style={{fontSize:10}}>{t.label}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 text-[10px]" style={{color:'#6a6860',fontFamily:'IBM Plex Mono,monospace'}}>
          All {n} players in this lobby pay exactly <span style={{color:'#7b5cfa'}}>${tier.fee}</span> USDC each.
          Total pool: <span style={{color:'#f0ece4'}}>{fmtU(totalPool)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        <Card className="p-4">
          <div className="text-[10px] mb-2" style={{color:'#6a6860',textTransform:'uppercase',letterSpacing:'0.06em'}}>Oracle resolved value</div>
          <div className="flex items-center gap-2 mb-3">
            <input type="number" step="0.001" value={actualValue/1000}
              onChange={e => setActual(Math.round(Number(e.target.value)*1000))}
              className="px-3 py-2 text-[14px] w-40 outline-none"
              style={{background:'#1a1a1a',border:'1px solid #00e87a',color:'#00e87a',fontFamily:'IBM Plex Mono,monospace'}} />
            <span className="text-[10px]" style={{color:'#6a6860'}}>actual outcome</span>
          </div>
          <div className="text-[11px] leading-loose" style={{color:'#6a6860'}}>
            <div>Median error: <span style={{color:'#f0ece4'}}>{result.medianError>0 ? displayVal(result.medianError) : 'N/A'}</span></div>
            <div>Winners (error &lt; median): <span style={{color:'#00e87a'}}>{result.winnerCount}</span></div>
            <div>Losers (error ≥ median): <span style={{color:'#ff4455'}}>{result.loserCount}</span></div>
          </div>
        </Card>
        <Card className="p-4">
          <SliderRow label="Platform fee (% of loser pool)" value={protoBps} min={0} max={3000} step={100}
            onChange={setProtoBps} display={`${(protoBps/100).toFixed(0)}%`} />
          <div className="text-[10px] mb-4" style={{color:'#6a6860'}}>
            Note: fee taken from loser pool, not total pool (per your image)
          </div>
          <SliderRow label="Decay exponent (^N)" value={decayExp} min={1} max={12}
            onChange={setDecayExp} display={`^${decayExp}`} />
          <div className="text-[10px]" style={{color:'#6a6860'}}>
            Higher = rewards closer predictions more steeply
          </div>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 mb-4">
        <MetricCard label="Total pool" value={fmtU(totalPool)} sub={`${n} × $${tier.fee}`} />
        <MetricCard label="Loser pool" value={fmtU(loserPoolRaw)} color="red"
          sub={`${result.loserCount} losers × $${tier.fee}`} />
        <MetricCard label="Platform fee" value={fmtU(platformFee)} color="purple"
          sub={`${(protoBps/100).toFixed(0)}% of loser pool`} />
        <MetricCard label="Prize pool" value={fmtU(prizePool)} color="green"
          sub="split to winners by accuracy" />
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 mb-6">
        <MetricCard label="Median error" value={result.medianError>0 ? displayVal(result.medianError) : '—'} sub="cutoff line" />
        <MetricCard label="Winners" value={`${result.winnerCount}`} color="green" sub="error < median (strict)" />
        <MetricCard label="Losers" value={`${result.loserCount}`} color="red" sub="error ≥ median" />
        <MetricCard label="Entry fee returned" value={`$${tier.fee}`} color="purple" sub="winners get stake back + profit" />
      </div>

      <Divider />
      <SectionLabel>Trader predictions — edit prediction values (stakes are fixed at ${tier.fee})</SectionLabel>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr style={{borderBottom:'1px solid #222'}}>
              {['Trader',`Stake (fixed $${tier.fee})`,'Prediction','Error','σ away','Status','Weight%','Payout','Profit','ROI',''].map(h => (
                <th key={h} className="text-left py-2 px-2 font-normal whitespace-nowrap" style={{color:'#6a6860'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tradersFinal.map((t, i) => (
              <tr key={i} style={{borderBottom:'1px solid #1a1a1a',background:t.won?'rgba(123,92,250,0.02)':'rgba(255,68,85,0.02)'}}>
                <td className="py-1.5 px-2">
                  <input value={t.name} onChange={e=>update(i,'name',e.target.value)}
                    className="bg-transparent w-16 outline-none" style={{color:'#f0ece4'}} />
                </td>
                <td className="py-1.5 px-2" style={{color:'#7b5cfa',fontFamily:'IBM Plex Mono,monospace'}}>
                  ${tier.fee} <span style={{color:'#444',fontSize:9}}>(fixed)</span>
                </td>
                <td className="py-1.5 px-2">
                  <input type="number" step="0.001" value={t.prediction/1000}
                    onChange={e=>update(i,'prediction',Math.round(Number(e.target.value)*1000))}
                    className="w-24 px-1.5 py-1 text-[11px] outline-none"
                    style={{background:'#1a1a1a',border:'1px solid #222',color:'#f0ece4'}} />
                </td>
                <td className="py-1.5 px-2" style={{color:'#6a6860'}}>{displayVal(t.error)}</td>
                <td className="py-1.5 px-2" style={{color:t.sigmaAway<1?'#00e87a':t.sigmaAway<2?'#f5a623':'#ff4455'}}>
                  {t.sigmaAway.toFixed(2)}σ
                </td>
                <td className="py-1.5 px-2"><WinBadge won={t.won} /></td>
                <td className="py-1.5 px-2" style={{color:'#7b5cfa'}}>{t.won ? t.weightPct.toFixed(1)+'%' : '—'}</td>
                <td className="py-1.5 px-2 font-medium" style={{color:t.won?'#00e87a':'#6a6860'}}>
                  {t.won ? fmtU(t.payout) : '$0.00'}
                </td>
                <td className="py-1.5 px-2 font-medium" style={{color:t.profit>=0?'#00e87a':'#ff4455'}}>
                  {t.profit>=0?'+':''}{fmtU(t.profit)}
                </td>
                <td className="py-1.5 px-2" style={{color:t.roi>=0?'#00e87a':'#ff4455'}}>{t.roi.toFixed(1)}%</td>
                <td className="py-1.5 px-2">
                  <button onClick={()=>removeTrader(i)} style={{color:'#6a6860'}}
                    onMouseEnter={e=>(e.currentTarget.style.color='#ff4455')}
                    onMouseLeave={e=>(e.currentTarget.style.color='#6a6860')}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addTrader} className="mt-3 text-[11px] px-4 py-2 transition-all"
        style={{color:'#6a6860',border:'1px solid #222'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#7b5cfa';e.currentTarget.style.color='#7b5cfa'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#222';e.currentTarget.style.color='#6a6860'}}>
        + add player (pays ${tier.fee} fixed)
      </button>

      <Divider />
      <SectionLabel>Step-by-step (exact from your image)</SectionLabel>
      <div className="p-4 text-[11px] leading-loose border" style={{background:'#1a1a1a',borderColor:'#222',fontFamily:'IBM Plex Mono,monospace',color:'#b8b4ac'}}>
        <div style={{color:'#6a6860'}}>// N players, each pays F = ${tier.fee} entry fee</div>
        <div>total_pool = {n} × ${tier.fee} = <span style={{color:'#f0ece4'}}>{fmtU(totalPool)}</span></div>
        <div style={{marginTop:8,color:'#6a6860'}}>// Errors, sort, find median (k = floor((N+1)/2))</div>
        <div>N={n}, k = floor({n+1}/2) = {Math.floor((n+1)/2)}</div>
        <div>median_error = <span style={{color:'#f0ece4'}}>{result.medianError>0?displayVal(result.medianError):'N/A'}</span></div>
        <div style={{marginTop:8,color:'#6a6860'}}>// Winners: error strictly less than median</div>
        <div>losers = {result.loserCount} → loser_pool = {result.loserCount} × ${tier.fee} = <span style={{color:'#ff4455'}}>{fmtU(loserPoolRaw)}</span></div>
        <div>platform_fee = {(protoBps/100).toFixed(0)}% × {fmtU(loserPoolRaw)} = <span style={{color:'#7b5cfa'}}>− {fmtU(platformFee)}</span></div>
        <div>prize_pool Q = {fmtU(loserPoolRaw)} − {fmtU(platformFee)} = <span style={{color:'#00e87a'}}>{fmtU(prizePool)}</span></div>
        <div style={{marginTop:8,color:'#6a6860'}}>// Accuracy weight: a_i = (1/(1+r_i))^{decayExp} where r_i = error_i/median</div>
        <div style={{marginTop:8,color:'#6a6860'}}>// Winner payouts (entry fee F returned + profit share):</div>
        {tradersFinal.filter(t=>t.won).map(t=>(
          <div key={t.name} style={{marginLeft:8}}>
            {t.name}: w={t.weightPct.toFixed(2)}% → S_i = {t.weightPct.toFixed(2)}% × {fmtU(prizePool)}
            = <span style={{color:'#00e87a'}}>{fmtU(t.profit > 0 ? t.profit : 0)}</span>
            &nbsp;profit. R_i = F + S_i = ${tier.fee} + {fmtU(t.profit>0?t.profit:0)} = <span style={{color:'#00e87a'}}>{fmtU(t.payout)}</span>
          </div>
        ))}
        <div style={{color:'#ff4455',marginTop:4}}>
          {result.loserCount} losers lose their ${tier.fee} entry fee each = {fmtU(loserPoolRaw)} total lost
        </div>
      </div>
    </div>
  )
}
