'use client'
import React, { useState, useCallback } from 'react'
import { settleMultiOutcome, toRaw, fmtU, MultiTrader } from '../lib/math'
import { MetricCard, SliderRow, Divider, WinBadge, Card, SectionLabel } from './ui'

const COLORS = ['#00e87a','#7b5cfa','#f5a623','#00b4ff']
const BCOLORS = ['rgba(0,232,122,0.1)','rgba(123,92,250,0.1)','rgba(245,166,35,0.1)','rgba(0,180,255,0.1)']

const DEFAULT_LABELS = ['Real Madrid','Arsenal','Bayern','PSG']
const DEFAULT_TRADERS: MultiTrader[] = [
  { name: 'Alice', stake: toRaw(10),  outcome: 0 },
  { name: 'Bob',   stake: toRaw(50),  outcome: 0 },
  { name: 'Carol', stake: toRaw(15),  outcome: 1 },
  { name: 'Dan',   stake: toRaw(200), outcome: 1 },
  { name: 'Eve',   stake: toRaw(10),  outcome: 2 },
  { name: 'Frank', stake: toRaw(8),   outcome: 2 },
  { name: 'Grace', stake: toRaw(12),  outcome: 3 },
  { name: 'Hank',  stake: toRaw(100), outcome: 0 },
  { name: 'Iris',  stake: toRaw(5),   outcome: 3 },
  { name: 'Jake',  stake: toRaw(30),  outcome: 1 },
]

export default function MultiOutcomeSim() {
  const [traders, setTraders]           = useState<MultiTrader[]>(DEFAULT_TRADERS)
  const [labels, setLabels]             = useState(DEFAULT_LABELS)
  const [outcomeCount, setOutcomeCount] = useState(4)
  const [resolved, setResolved]         = useState(0)
  const [lpBps, setLpBps]               = useState(150)
  const [protoBps, setProtoBps]         = useState(50)

  const activeLabels = labels.slice(0, outcomeCount)
  const filtered = traders.filter(t => t.outcome < outcomeCount)
  const result = settleMultiOutcome(filtered, resolved, activeLabels, lpBps, protoBps)

  const update = useCallback((i: number, field: keyof MultiTrader, val: string | number) => {
    setTraders(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: field === 'stake' ? val : Number(val) } : t))
  }, [])
  const addTrader = () => setTraders(prev => [...prev, { name: `P${prev.length+1}`, stake: toRaw(10), outcome: 0 }])
  const removeTrader = (i: number) => setTraders(prev => prev.filter((_,idx) => idx !== i))

  return (
    <div>
      {/* Design note */}
      <div style={{background:'rgba(245,166,35,0.06)',border:'1px solid rgba(245,166,35,0.2)',padding:'12px 16px',marginBottom:20,fontSize:12,lineHeight:1.6,color:'#b8b4ac'}}>
        <span style={{color:'#f5a623',fontWeight:600}}>Variable stakes. Same math as Yes/No. </span>
        Users bet any amount on any outcome. Winning outcome pool splits ALL losing outcome pools
        proportionally by net stake. Bigger bet on winning side = bigger proportional payout.
        <span style={{color:'#6a6860'}}> 2–4 outcomes. Exactly same formula as binary, just N pools.</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        <Card className="p-4">
          <div className="text-[10px] mb-3" style={{color:'#6a6860',textTransform:'uppercase',letterSpacing:'0.06em'}}>Outcomes (2–4)</div>
          <div className="flex gap-1 mb-3">
            {[2,3,4].map(n => (
              <button key={n} onClick={() => { setOutcomeCount(n); if(resolved>=n) setResolved(0) }}
                className="flex-1 py-1.5 text-[11px] border transition-all"
                style={{
                  borderColor: outcomeCount===n ? '#f5a623' : '#222',
                  color: outcomeCount===n ? '#f5a623' : '#6a6860',
                  background: outcomeCount===n ? 'rgba(245,166,35,0.1)' : 'transparent'
                }}>{n}</button>
            ))}
          </div>
          {activeLabels.map((l,i) => (
            <input key={i} value={l}
              onChange={e => setLabels(prev => prev.map((x,j) => j===i ? e.target.value : x))}
              className="block w-full px-2 py-1 text-[11px] mb-1 outline-none"
              style={{background:'#1a1a1a',border:'1px solid #222',color:COLORS[i]}} />
          ))}
        </Card>
        <Card className="p-4">
          <SliderRow label="LP fee → creator" value={lpBps} min={0} max={500} step={10}
            onChange={setLpBps} display={`${(lpBps/100).toFixed(2)}%`} />
          <SliderRow label="Protocol fee" value={protoBps} min={0} max={200} step={5}
            onChange={setProtoBps} display={`${(protoBps/100).toFixed(2)}%`} />
          <div className="text-[10px] mt-1" style={{color:'#6a6860'}}>Total: {((lpBps+protoBps)/100).toFixed(2)}%</div>
          <div className="text-[10px] mt-1" style={{color:'#6a6860'}}>Creator earns LP fee on total volume regardless of which outcome wins.</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] mb-3" style={{color:'#6a6860',textTransform:'uppercase',letterSpacing:'0.06em'}}>Oracle: winning outcome</div>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {activeLabels.map((l,i) => (
              <button key={i} onClick={() => setResolved(i)}
                className="py-2 text-[10px] border transition-all truncate px-1"
                style={{
                  borderColor: resolved===i ? COLORS[i] : '#222',
                  color: resolved===i ? COLORS[i] : '#6a6860',
                  background: resolved===i ? BCOLORS[i] : 'transparent'
                }}>{l}</button>
            ))}
          </div>
          <div className="text-[10px] leading-loose" style={{color:'#6a6860'}}>
            {activeLabels.map((l,i) => (
              <div key={i}>
                <span style={{color:COLORS[i]}}>{l}: </span>
                <span style={{color:'#f0ece4'}}>{fmtU(result.outcomePools[i]??0)}</span>
                {i===resolved && <span style={{color:'#00e87a'}}> ← wins</span>}
              </div>
            ))}
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
        <MetricCard label="Winners" value={`${result.winnerCount}`} color="green"
          sub={`picked "${activeLabels[resolved]}"`} />
        <MetricCard label="Losers" value={`${result.loserCount}`} color="red" />
        {activeLabels.map((l,i) => (
          <MetricCard key={i} label={`"${l.slice(0,8)}" pool`}
            value={fmtU(result.outcomePools[i]??0)}
            color={i===resolved ? 'green' : 'white'}
            sub={i===resolved ? '← winner takes all' : '← funds winners'} />
        ))}
      </div>

      <Divider />
      <SectionLabel>Trader positions — any stake amount</SectionLabel>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr style={{borderBottom:'1px solid #222'}}>
              {['Trader','Stake (USDC)','Outcome','Stake net','Status','% of winner pool','Payout','Profit','ROI',''].map(h => (
                <th key={h} className="text-left py-2 px-2 font-normal" style={{color:'#6a6860'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.traders.map((t, i) => {
              const wpNet = result.outcomePoolsNet[resolved] ?? 0
              const pct = t.won && wpNet > 0 ? (t.stakeNet / wpNet * 100).toFixed(1) : null
              return (
                <tr key={i} style={{borderBottom:'1px solid #1a1a1a',background:t.won?'rgba(0,232,122,0.02)':'rgba(255,68,85,0.02)'}}>
                  <td className="py-1.5 px-2">
                    <input value={t.name} onChange={e=>update(i,'name',e.target.value)}
                      className="bg-transparent w-16 outline-none" style={{color:'#f0ece4'}} />
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1">
                      <span style={{color:'#6a6860',fontSize:10}}>$</span>
                      <input type="number" min="0.01" step="0.01"
                        value={(t.stake/1_000_000).toFixed(2)}
                        onChange={e=>update(i,'stake',toRaw(Number(e.target.value)))}
                        className="w-24 px-1.5 py-1 text-[11px] outline-none"
                        style={{background:'#1a1a1a',border:'1px solid #222',color:'#f0ece4'}} />
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <select value={t.outcome} onChange={e=>update(i,'outcome',e.target.value)}
                      className="px-2 py-1 text-[10px] outline-none"
                      style={{background:'#1a1a1a',border:'1px solid #222',color:COLORS[t.outcome]}}>
                      {activeLabels.map((l,j)=><option key={j} value={j}>{l}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-2" style={{color:'#6a6860'}}>{fmtU(t.stakeNet)}</td>
                  <td className="py-1.5 px-2"><WinBadge won={t.won} /></td>
                  <td className="py-1.5 px-2" style={{color:'#7b5cfa'}}>{pct ? pct+'%' : '—'}</td>
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
      <SectionLabel>Money flow</SectionLabel>
      <div className="p-4 text-[11px] leading-loose border" style={{background:'#1a1a1a',borderColor:'#222',fontFamily:'IBM Plex Mono,monospace',color:'#b8b4ac'}}>
        <div>Total staked: <span style={{color:'#f0ece4'}}>{fmtU(result.totalPool)}</span></div>
        <div>LP fee (creator): <span style={{color:'#f5a623'}}>− {fmtU(result.lpFee)}</span></div>
        <div>Protocol fee: <span style={{color:'#7b5cfa'}}>− {fmtU(result.protocolFee)}</span></div>
        <div style={{borderTop:'1px solid #222',marginTop:4,paddingTop:4}}>
          &quot;{activeLabels[resolved]}&quot; wins → {result.winnerCount} winners split loser pool <span style={{color:'#00e87a'}}>{fmtU(result.loserPool)}</span>
        </div>
        {result.traders.filter(t=>t.won).map(t=>(
          <div key={t.name} style={{marginLeft:12}}>
            {t.name} (staked {fmtU(t.stake)}): <span style={{color:'#00e87a'}}>{fmtU(t.payout)}</span>
            <span style={{color:'#6a6860'}}> (+{fmtU(t.profit)}, {t.roi.toFixed(1)}% ROI)</span>
          </div>
        ))}
        <div style={{color:'#ff4455',marginTop:4}}>
          {result.loserCount} losers on wrong outcomes: total lost {fmtU(result.traders.filter(t=>!t.won).reduce((s,t)=>s+t.stake,0))}
        </div>
        <div style={{marginTop:8,color:'#6a6860',borderTop:'1px solid #222',paddingTop:8}}>
          Creator earns: <span style={{color:'#f5a623'}}>{fmtU(result.lpFee)}</span> regardless of which outcome wins
        </div>
      </div>
    </div>
  )
}
