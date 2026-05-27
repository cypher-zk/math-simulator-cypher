'use client'
import React, { useState, useCallback } from 'react'
import { settleYesNo, toRaw, fmtU, YesNoTrader } from '../lib/math'
import { MetricCard, SliderRow, Divider, WinBadge, Card, SectionLabel } from './ui'

// Variable stakes — users can bet ANY amount
// Same math applies to Multi-outcome (N pools instead of 2)
const DEFAULT_TRADERS: YesNoTrader[] = [
  { name: 'Bob',   stake: toRaw(10), side: 'YES' },
  { name: 'Carol', stake: toRaw(5),  side: 'YES' },
  { name: 'Dan',   stake: toRaw(20), side: 'NO'  },
  { name: 'Eve',   stake: toRaw(15), side: 'NO'  },
  { name: 'Frank', stake: toRaw(8),  side: 'YES' },
  { name: 'Grace', stake: toRaw(30), side: 'NO'  },
  { name: 'Hank',  stake: toRaw(12), side: 'YES' },
  { name: 'Iris',  stake: toRaw(50), side: 'YES' },
  { name: 'Jake',  stake: toRaw(7),  side: 'NO'  },
  { name: 'Zara',  stake: toRaw(25), side: 'YES' },
]

export default function YesNoSim() {
  const [traders, setTraders]       = useState<YesNoTrader[]>(DEFAULT_TRADERS)
  const [resolvedSide, setResolved] = useState<'YES' | 'NO'>('YES')
  const [lpBps, setLpBps]           = useState(150)   // 1.5% to creator
  const [protoBps, setProtoBps]     = useState(50)    // 0.5% to protocol

  const result = settleYesNo(traders, resolvedSide, lpBps, protoBps)

  const update = useCallback((i: number, field: keyof YesNoTrader, val: string | number) => {
    setTraders(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }, [])

  const addTrader = () => setTraders(prev => [
    ...prev, { name: `P${prev.length + 1}`, stake: toRaw(10), side: 'YES' }
  ])
  const removeTrader = (i: number) => setTraders(prev => prev.filter((_, idx) => idx !== i))

  const feeTotal = lpBps + protoBps

  return (
    <div>
      {/* Design note */}
      <div style={{
        background:'rgba(0,232,122,0.06)', border:'1px solid rgba(0,232,122,0.2)',
        padding:'12px 16px', marginBottom:20, fontSize:12, lineHeight:1.6,
        color:'#b8b4ac'
      }}>
        <span style={{color:'#00e87a',fontWeight:600}}>Variable stakes. </span>
        Users bet any amount — $5, $20, $200. Bigger stake = bigger proportional share of the loser pool.
        Winners split the loser pool in proportion to their own net bet.
        <span style={{color:'#6a6860'}}> Formula: payout = stake_net + (stake_net / winner_pool_net) × loser_pool</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <Card className="p-4">
          <SliderRow label="LP fee → creator" value={lpBps} min={0} max={500} step={10}
            onChange={setLpBps} display={`${(lpBps/100).toFixed(2)}%`} />
          <SliderRow label="Protocol fee → treasury" value={protoBps} min={0} max={200} step={5}
            onChange={setProtoBps} display={`${(protoBps/100).toFixed(2)}%`} />
          <div className="text-[10px]" style={{color:'#6a6860'}}>
            Total fee: {(feeTotal/100).toFixed(2)}% — Net to pool: {((10000-feeTotal)/100).toFixed(2)}%
          </div>
          <div className="text-[10px] mt-2" style={{color:'#6a6860'}}>
            Creator earns LP fee on total volume. More volume = more earnings.
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] mb-3" style={{color:'#6a6860',textTransform:'uppercase',letterSpacing:'0.06em'}}>Oracle resolution</div>
          <div className="flex gap-2 mb-4">
            {(['YES','NO'] as const).map(s => (
              <button key={s} onClick={() => setResolved(s)}
                className={`flex-1 py-2 text-[11px] border transition-all ${
                  resolvedSide === s
                    ? s === 'YES'
                      ? 'bg-[rgba(0,232,122,0.12)] border-[#00e87a] text-[#00e87a]'
                      : 'bg-[rgba(255,68,85,0.12)] border-[#ff4455] text-[#ff4455]'
                    : 'border-[#222] text-[#6a6860] hover:border-[#444]'
                }`}>{s} wins</button>
            ))}
          </div>
          <div className="text-[11px] leading-loose" style={{color:'#6a6860'}}>
            YES pool (raw): <span style={{color:'#f0ece4'}}>{fmtU(result.yesPool)}</span>
            <br />NO pool (raw): <span style={{color:'#f0ece4'}}>{fmtU(result.noPool)}</span>
          </div>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 mb-4">
        <MetricCard label="Total staked" value={fmtU(result.totalPool)} />
        <MetricCard label="LP fee → creator" value={fmtU(result.lpFee)} color="amber" />
        <MetricCard label="Protocol fee" value={fmtU(result.protocolFee)} color="purple" />
        <MetricCard label="Loser pool (prize)" value={fmtU(result.loserPool)} color="green" />
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 mb-6">
        <MetricCard label="Winners" value={`${result.winnerCount}`} color="green" sub={`picked ${result.resolvedSide}`} />
        <MetricCard label="Losers" value={`${result.loserCount}`} color="red" sub="lose full stake" />
        <MetricCard label={`${result.resolvedSide} pool net`}
          value={fmtU(result.resolvedSide==='YES' ? result.yesPool - Math.floor(result.yesPool*(lpBps+protoBps)/10000) : result.noPool - Math.floor(result.noPool*(lpBps+protoBps)/10000))}
          sub="after fees, used as denominator" />
        <MetricCard label="Biggest winner"
          value={fmtU(Math.max(...result.traders.filter(t=>t.won).map(t=>t.profit), 0))}
          color="green" sub="net profit" />
      </div>

      <Divider />
      <SectionLabel>Trader positions — any stake amount</SectionLabel>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr style={{borderBottom:'1px solid #222'}}>
              {['Trader','Stake (USDC)','Side','Stake net','Status','% of winner pool','Payout','Profit','ROI',''].map(h => (
                <th key={h} className="text-left py-2 px-3 font-normal" style={{color:'#6a6860'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.traders.map((t, i) => {
              const winnerPoolNet = resolvedSide === 'YES'
                ? result.traders.filter(x=>x.side==='YES').reduce((s,x)=>s+x.stakeNet,0)
                : result.traders.filter(x=>x.side==='NO').reduce((s,x)=>s+x.stakeNet,0)
              const pct = t.won && winnerPoolNet > 0 ? (t.stakeNet / winnerPoolNet) * 100 : 0
              return (
                <tr key={i} style={{borderBottom:'1px solid #1a1a1a', background: t.won ? 'rgba(0,232,122,0.02)' : 'rgba(255,68,85,0.02)'}}>
                  <td className="py-2 px-3">
                    <input value={t.name} onChange={e => update(i,'name',e.target.value)}
                      className="bg-transparent w-20 outline-none" style={{color:'#f0ece4',borderBottom:'1px solid transparent'}}
                      onFocus={e=>(e.target.style.borderBottomColor='#00e87a')}
                      onBlur={e=>(e.target.style.borderBottomColor='transparent')} />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <span style={{color:'#6a6860',fontSize:10}}>$</span>
                      <input type="number" min="0.01" step="0.01"
                        value={(t.stake/1_000_000).toFixed(2)}
                        onChange={e => update(i,'stake',toRaw(Number(e.target.value)))}
                        className="w-24 px-2 py-1 text-[11px] outline-none"
                        style={{background:'#1a1a1a',border:'1px solid #222',color:'#f0ece4'}} />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <select value={t.side} onChange={e => update(i,'side',e.target.value as 'YES'|'NO')}
                      className="px-2 py-1 text-[11px] outline-none"
                      style={{background:'#1a1a1a',border:'1px solid #222',color: t.side==='YES' ? '#00e87a' : '#ff4455'}}>
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="py-2 px-3" style={{color:'#6a6860'}}>{fmtU(t.stakeNet)}</td>
                  <td className="py-2 px-3"><WinBadge won={t.won} /></td>
                  <td className="py-2 px-3" style={{color: t.won ? '#7b5cfa' : '#6a6860'}}>
                    {t.won ? pct.toFixed(1)+'%' : '—'}
                  </td>
                  <td className="py-2 px-3 font-medium" style={{color: t.won ? '#00e87a' : '#6a6860'}}>
                    {t.won ? fmtU(t.payout) : '$0.00'}
                  </td>
                  <td className="py-2 px-3 font-medium" style={{color: t.profit >= 0 ? '#00e87a' : '#ff4455'}}>
                    {t.profit >= 0 ? '+' : ''}{fmtU(t.profit)}
                  </td>
                  <td className="py-2 px-3" style={{color: t.roi >= 0 ? '#00e87a' : '#ff4455'}}>
                    {t.roi.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3">
                    <button onClick={() => removeTrader(i)} style={{color:'#6a6860'}}
                      onMouseEnter={e=>(e.currentTarget.style.color='#ff4455')}
                      onMouseLeave={e=>(e.currentTarget.style.color='#6a6860')}>×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button onClick={addTrader} className="mt-3 text-[11px] px-4 py-2 transition-all"
        style={{color:'#6a6860',border:'1px solid #222'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#00e87a';e.currentTarget.style.color='#00e87a'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#222';e.currentTarget.style.color='#6a6860'}}>
        + add trader
      </button>

      <Divider />
      <SectionLabel>Money flow — every dollar traced</SectionLabel>

      <div className="p-4 text-[11px] leading-loose border" style={{background:'#1a1a1a',borderColor:'#222',fontFamily:'IBM Plex Mono,monospace',color:'#b8b4ac'}}>
        <div>Total staked:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#f0ece4'}}>{fmtU(result.totalPool)}</span></div>
        <div>LP fee (creator {(lpBps/100).toFixed(1)}%):&nbsp;<span style={{color:'#f5a623'}}>− {fmtU(result.lpFee)}</span></div>
        <div>Protocol fee ({(protoBps/100).toFixed(1)}%):&nbsp;&nbsp;<span style={{color:'#7b5cfa'}}>− {fmtU(result.protocolFee)}</span></div>
        <div style={{borderTop:'1px solid #222',marginTop:4,paddingTop:4}}>
          <span style={{color:'#f0ece4'}}>{result.resolvedSide}</span> wins → loser pool <span style={{color:'#00e87a'}}>{fmtU(result.loserPool)}</span> split to {result.winnerCount} winners:
        </div>
        {result.traders.filter(t=>t.won).map(t => {
          const winnerPoolNet = result.traders.filter(x=>x.won).reduce((s,x)=>s+x.stakeNet,0)
          const pct = winnerPoolNet > 0 ? (t.stakeNet/winnerPoolNet*100).toFixed(1) : '0'
          return (
            <div key={t.name} style={{marginLeft:12}}>
              {t.name} (staked {fmtU(t.stake)}, {pct}% of winner pool):&nbsp;
              <span style={{color:'#00e87a'}}>{fmtU(t.payout)}</span>
              <span style={{color:'#6a6860'}}> (+{fmtU(t.profit)}, {t.roi.toFixed(1)}% ROI)</span>
            </div>
          )
        })}
        <div style={{color:'#ff4455',marginTop:4}}>
          {result.loserCount} losers lose total:&nbsp;
          {fmtU(result.traders.filter(t=>!t.won).reduce((s,t)=>s+t.stake,0))}
          <span style={{color:'#6a6860'}}> (their full stake — no partial loss)</span>
        </div>
        <div style={{marginTop:8,color:'#6a6860',borderTop:'1px solid #222',paddingTop:8}}>
          Creator earns: <span style={{color:'#f5a623'}}>{fmtU(result.lpFee)}</span> LP fee
          &nbsp;(more volume = more earnings — no bond LP, pure fee income)
        </div>
      </div>
    </div>
  )
}
