'use client'
import React, { useState } from 'react'

// ─── Data Flow Section ───────────────────────────────────────────────────────

type FlowTab = 'create' | 'place' | 'lock' | 'oracle' | 'settlement' | 'payout' | 'claim'

function DataFlowSection() {
  const [tab, setTab] = useState<FlowTab>('create')
  const tabs: { id: FlowTab; label: string }[] = [
    {id:'create',label:'0 · Create market'},
    {id:'place',label:'1 · Place bet'},
    {id:'lock',label:'2 · Lock'},
    {id:'oracle',label:'3 · Oracle'},
    {id:'settlement',label:'4 · Settlement'},
    {id:'payout',label:'5 · Payout math'},
    {id:'claim',label:'6 · Claim'},
  ]

  const content: Record<FlowTab, React.ReactNode> = {
    create: <div key="create">
      <div style={{marginBottom:16,fontSize:13,color:'#6a6860',fontFamily:'IBM Plex Mono,monospace',lineHeight:1.7}}>
        YesNo + MultiOutcome: 1 unified pool · Accuracy: 3 pools (one per tier $1/$10/$100) · Pool address reveals nothing about prediction
      </div>
      <FlowRow who="👤 creator — admin setup (once)" cls="u">
{`// run once at deploy
await program.methods.initialize(50, 150, 2000).rpc()
//   50  = 0.5% protocol fee (YesNo/Multi on total pool)
//   150 = 1.5% LP fee      (YesNo/Multi on total pool)
//   2000 = 20% accuracy fee (accuracy on loser pool only)
await program.methods.initYesnoCompDef().rpc()
await program.methods.initMultioutcomeCompDef().rpc()
await program.methods.initAccuracyCompDef().rpc()`}
      </FlowRow>
      <FlowLabel label="YesNo market" color="var(--green)"/>
      <FlowRow who="👤 creator — YesNo" cls="u">
{`await program.methods.createMarketGroup(MarketType.YesNo, MarketCategory.Crypto,
  "Will BTC close above $100k on Friday?",
  OracleType.Pyth, lock_timestamp, resolve_deadline, []
).rpc()                                           // locks $10 bond
await program.methods.createFlatMarket().rpc()    // bet_size=0, variable stakes
await program.methods.createPool(0, PoolType.Unified).rpc() // ONE pool — all bettors`}
      </FlowRow>
      <FlowLabel label="MultiOutcome market" color="var(--amber)"/>
      <FlowRow who="👤 creator — MultiOutcome" cls="u">
{`await program.methods.createMarketGroup(MarketType.MultiOutcome, ...,
  outcome_labels: ["Real Madrid","Arsenal","Bayern","PSG"]).rpc()
await program.methods.createFlatMarket().rpc()    // same as YesNo
await program.methods.createPool(0, PoolType.Unified).rpc() // ONE pool — all outcomes`}
      </FlowRow>
      <FlowLabel label="Accuracy market" color="var(--purple)"/>
      <FlowRow who="👤 creator — Accuracy" cls="u">
{`await program.methods.createMarketGroup(MarketType.Accuracy, ...,
  "SOL price at Friday close?").rpc()
// 3 tier markets — each has fixed bet_size, called 3 times
await program.methods.createTierMarket(Tier.Micro).rpc()    // $1  bet_size=1_000_000
await program.methods.createTierMarket(Tier.Standard).rpc() // $10
await program.methods.createTierMarket(Tier.Whale).rpc()    // $100
// each tier gets its own pool — user picks tier, NOT prediction
await program.methods.createPool(0, PoolType.Accuracy).rpc() // $1 pool
await program.methods.createPool(0, PoolType.Accuracy).rpc() // $10 pool
await program.methods.createPool(0, PoolType.Accuracy).rpc() // $100 pool`}
      </FlowRow>
      <FlowRow who="⛓ on-chain after creation" cls="c">
{`MarketGroup PDA  status: Open  bond: $10 locked

Pool PDA  seeds: ["pool", market, 0]
  pool_type:  Unified        // same for all bettors — side hidden
  vault:      UNIFIED_VAULT  // all USDC escrowed here
  total_staked: 0   participant_count: 0   status: Open`}
      </FlowRow>
      <FlowRow who="🤖 backend DB" cls="b">
{`INSERT INTO markets (pubkey, question, type, status, lock_timestamp, creator)
VALUES ('GROUP_PK', 'Will BTC close above $100k?', 'yesno', 'open', 1748890000, 'CREATOR')`}
      </FlowRow>
      <FlowRow who="📱 frontend  GET /markets" cls="f">
{`{ question: 'Will BTC close above $100k?', status: 'open', total_volume: '$0' }
// UI: "Betting open · locks in 2h 14m · $0 in pool"
// no YES/NO split — sides are private until settlement`}
      </FlowRow>
    </div>,
    place: <div key="place">
      <DiffBox
        old="✗ old — pool_index param = the prediction (leaked on-chain immediately)"
        oldCode="placeBet(pool_index: 0, encrypted, stake)  // 0=YES pool visible"
        nw="✓ new — no pool_index — side lives ONLY inside encrypted_payload"
        newCode="placeBet(encrypted, stake)  // side = inside encrypt({side:1})"
      />
      <FlowLabel label="YesNo — encrypt side (0 or 1)" color="var(--green)"/>
      <FlowRow who="👤 user (Alice — bets YES)" cls="u">
{`const mxeKey = await arciumClient.getClusterPubkey(clusterPDA)
const enc = await arciumClient.encrypt({ side: 1 }, mxeKey)  // 1=YES 0=NO
program.methods.placeBet(enc, 50_000_000).rpc()               // $50, no pool_index
// on-chain: pool=UNIFIED_POOL, encrypted_payload=[8f4a...], stake=$50 PUBLIC
// BetPlaced event: user + stake only — side NOT emitted`}
      </FlowRow>
      <FlowLabel label="MultiOutcome — encrypt outcome index (0–3)" color="var(--amber)"/>
      <FlowRow who="👤 user (bets Arsenal = index 1)" cls="u">
{`const enc = await arciumClient.encrypt({ outcome_index: 1 }, mxeKey)
program.methods.placeBet(enc, 30_000_000).rpc()  // $30, no pool_index
// nobody knows which team you picked — same unified pool as everyone`}
      </FlowRow>
      <FlowLabel label="Accuracy — encrypt predicted value (× 1000)" color="var(--purple)"/>
      <FlowRow who="👤 user (predicts SOL at $99.980, $10 tier)" cls="u">
{`const enc = await arciumClient.encrypt({ value: 99_980 }, mxeKey)
program.methods.placeBetAccuracy(enc)
  .accounts({ pool: ACCURACY_10_POOL }).rpc()  // no stake param — enforced as $10
// pool reveals tier ($10) but NOT the predicted value`}
      </FlowRow>
      <FlowRow who={'⛓ Position PDA  seeds: ["position", pool, user]'} cls="c">
{`pool:              UNIFIED_POOL        // same for ALL 4 bettors
encrypted_payload: [8f,4a,2c,9e,...]   // side hidden inside
stake:             50_000_000          // amount PUBLIC
payout:            0                   // filled after settlement
status:            Open`}
      </FlowRow>
      <div style={{textAlign:'center',color:'#333',fontSize:16,padding:'4px 0'}}>↓</div>
      <FlowRow who="🤖 backend DB" cls="b">
{`INSERT INTO positions (pubkey, pool, user, stake, status)
VALUES ('ALICE_POS', 'UNIFIED_POOL', 'ALICE', 50_000_000, 'open')
-- no side column — backend genuinely does not know
-- DB hack reveals: Alice bet $50. That's all.`}
      </FlowRow>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginTop:12,fontFamily:'IBM Plex Mono,monospace'}}>
        <thead><tr>{['Bettor','Pool','Stake','Side on-chain','Backend knows'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 8px',color:'#6a6860',fontSize:10,borderBottom:'1px solid #222',fontWeight:400,letterSpacing:'.06em'}}>{h}</th>)}</tr></thead>
        <tbody>{[
          {b:'Alice',pool:'UNIFIED',stake:'$50',side:'[8f4a…] opaque',knows:'wallet + stake only'},
          {b:'Bob',pool:'UNIFIED',stake:'$10',side:'[3c1d…] opaque',knows:'wallet + stake only'},
          {b:'Carol',pool:'UNIFIED',stake:'$30',side:'[a2f7…] opaque',knows:'wallet + stake only'},
          {b:'Dan',pool:'UNIFIED',stake:'$20',side:'[5b8c…] opaque',knows:'wallet + stake only'},
        ].map((r,i)=><tr key={i}>
          <td style={{padding:'5px 8px',borderBottom:'1px solid #111',color:'#f0ece4'}}>{r.b}</td>
          <td style={{padding:'5px 8px',borderBottom:'1px solid #111',color:'#b8b4ac'}}>{r.pool}</td>
          <td style={{padding:'5px 8px',borderBottom:'1px solid #111',color:'#00e87a'}}>{r.stake}</td>
          <td style={{padding:'5px 8px',borderBottom:'1px solid #111',color:'#7b5cfa'}}>{r.side}</td>
          <td style={{padding:'5px 8px',borderBottom:'1px solid #111',color:'#6a6860'}}>{r.knows}</td>
        </tr>)}</tbody>
      </table>
      <div style={{marginTop:8,background:'rgba(0,232,122,.08)',border:'1px solid rgba(0,232,122,.2)',padding:'7px 12px',borderRadius:4,fontSize:12,color:'#00e87a'}}>
        Pre-settlement the world sees: 4 bettors, $110 total. Who bet what side? Completely unknown.
      </div>
    </div>,
    lock: <div key="lock">
      <FlowRow who="🤖 backend cron — every 60s" cls="b">
{`const tolock = await db.query(
  'SELECT * FROM markets WHERE status=? AND lock_timestamp <= ?',
  ['open', Math.floor(Date.now() / 1000)]
)
for (const m of tolock)
  await program.methods.lockMarket().rpc()
// permissionless — any user can call as fallback if backend is down`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="⛓ contract" cls="c">
{`group.status = GroupStatus::Locked
// Event: GroupLocked { total_participants: 4, locked_at: now }
// sides still completely encrypted — nobody knows YES/NO split`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="🤖 backend" cls="b">
{`UPDATE markets SET status='locked', locked_at=now`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="📱 frontend  GET /markets/GROUP_PK" cls="f">
{`{ status: "locked", participants: 4, total_volume: "$110" }
// UI: "Betting closed · $110 in pool · Awaiting oracle"
// no YES/NO split shown — sides still private`}
      </FlowRow>
    </div>,
    oracle: <div key="oracle">
      <FlowRow who="🔮 oracle service" cls="b">
{`// YesNo: Pyth confirms BTC = $101k → YES won
await program.methods.postResolution({ yesNo: true }).rpc()

// MultiOutcome: creator or Pyth posts which outcome won
await program.methods.postResolution({ outcome: 1 }).rpc()   // Arsenal won = index 1

// Accuracy: Pyth posts actual closing price × 1000
await program.methods.postResolution({ numeric: 100_000 }).rpc() // SOL = $100.000`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="⛓ contract — same pattern all types" cls="c">
{`group.resolved_value   = YesNo(true)  // or Outcome(1) or Numeric(100_000)
group.dispute_deadline = now + 3600
group.status           = GroupStatus::Resolving
// resolved_value public — positions still encrypted — nobody knows who won yet`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="🤖 backend" cls="b">
{`UPDATE markets SET status='resolving', resolved_value='YES' // or 'ARSENAL' or '100.000'
setTimeout(runSettlement, 3600_000)  // fires after dispute window`}
      </FlowRow>
    </div>,
    settlement: <div key="settlement">
      <FlowLabel label="YesNo + MultiOutcome — same settlement flow" color="var(--green)"/>
      <FlowRow who="🤖 backend — after 1hr dispute window" cls="b">
{`// ceil(participants / 8) shards per pool
await program.methods.initSettlementRegistry(total_shards).rpc()

// CRITICAL: save position order BEFORE queuing — maps winner_mask[i] → Position PDA
INSERT INTO shards VALUES (pool, 0, '["ALICE_POS","BOB_POS","CAROL_POS","DAN_POS"]')

// YesNo: pass resolved_side=1
await program.methods.queueSettlementYesno(
  offset, [alice_enc,bob_enc,carol_enc,dan_enc], pk, nonce, 1, shard_idx
).rpc()
// MultiOutcome: pass resolved_outcome=1 (Arsenal)
// await program.methods.queueSettlementMultioutcome(offset, [...], pk, nonce, 1, idx).rpc()`}
      </FlowRow>
      <Arrow label="Arcium MPC runs — nobody can see inside"/>
      <FlowRow who="🔐 arcium MXE — YesNo or MultiOutcome circuit" cls="arc">
{`// YesNo:  is decrypt(enc_i) == resolved_side?
// Multi:  is decrypt(enc_i) == resolved_outcome?
// same circuit logic, same output format
output.field_0 = [1, 1, 0, 0, 0, 0, 0, 0]  // winner_mask per position`}
      </FlowRow>
      <Arrow label="callback fires automatically"/>
      <FlowRow who="⛓ callback — same for YesNo + Multi" cls="c">
{`registry.settled_shards++  // when == total_shards → Finalizing
// ShardSettled { winner_mask: [1,1,0,0,...] }
// lp_fee → creator   protocol_fee → treasury
// RegistryFinalized → backend triggers payout`}
      </FlowRow>
      <FlowLabel label="Accuracy — different settlement" color="var(--purple)" mt={16}/>
      <FlowRow who="🤖 backend — accuracy" cls="b">
{`await program.methods.queueSettlementAccuracy(
  offset, [enc_A,enc_B,enc_C,enc_D], pk, nonce, 100_000, shard_idx
).rpc()  // resolved_value = numeric`}
      </FlowRow>
      <FlowRow who="🔐 arcium MXE — accuracy circuit outputs ERRORS not winner flags" cls="arc">
{`// |decrypt(enc_i) - resolved_value| per position
output.field_0 = [20, 100, 400, 1000]  // errors as u64, encoded as bytes in ShardSettled`}
      </FlowRow>
      <div style={{marginTop:8,background:'rgba(245,166,35,.08)',border:'1px solid rgba(245,166,35,.2)',padding:'7px 12px',borderRadius:4,fontSize:12,color:'#f5a623',fontFamily:'IBM Plex Mono,monospace'}}>
        Post-settlement: winner_mask is public. YES won + Alice got paid → observers can infer Alice bet YES. Market is closed — this is the acceptable tradeoff.
      </div>
    </div>,
    payout: <div key="payout">
      <FlowLabel label="YesNo payout" color="var(--green)"/>
      <FlowRow who="🤖 backend — YesNo + MultiOutcome (identical formula)" cls="b">
{`// winner_mask [1,1,0,0] + shard order + stakes from DB (BetPlaced events)
net(Alice) = 50_000_000 × 0.98 = 49_000_000   // winner
net(Bob)   = 10_000_000 × 0.98 =  9_800_000   // winner
net(Carol) = 30_000_000 × 0.98 = 29_400_000   // loser
net(Dan)   = 20_000_000 × 0.98 = 19_600_000   // loser

winnerPool = 49M + 9.8M = 58.8M   loserPool = 29.4M + 19.6M = 49M
// payout = stakeNet + (stakeNet / winnerPool) × loserPool
Alice → $89.76   Bob → $17.95   Carol → $0   Dan → $0`}
      </FlowRow>
      <FlowLabel label="Accuracy payout" color="var(--purple)" mt={12}/>
      <FlowRow who="🤖 backend — accuracy" cls="b">
{`// decode errors from ShardSettled events (8 bytes each, little-endian u64)
errors = [20n, 100n, 400n, 1000n]
sorted = [20, 100, 400, 1000]  median = 100  // k=floor((4+1)/2)=2 → sorted[1]

// winner = error STRICTLY less than median (equal = loser)
Alice 20  < 100  → WINNER   Bob 100 = 100 → LOSER
Carol 400 > 100  → LOSER    Dan 1000 > 100 → LOSER

loserPool = 3 × 10_000_000 = $30   platformFee = $6 (20%)   prizePool = $24
Alice payout = betSize + prizePool = $10 + $24 = $34
// multiple winners: weighted by (SCALE/(SCALE+rel_err))^6`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="⛓ write_position_payout — 1 call per position" cls="c">
{`program.methods.writePositionPayout(89_761_904n).accounts({ position: ALICE_POS }).rpc()
// position.payout = 89_761_904   position.status = Settled
program.methods.writePositionPayout(17_952_380n).accounts({ position: BOB_POS }).rpc()
program.methods.writePositionPayout(0n).accounts({ position: CAROL_POS }).rpc()
program.methods.writePositionPayout(0n).accounts({ position: DAN_POS }).rpc()`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="🤖 backend DB" cls="b">
{`UPDATE positions SET payout=89_761_904, is_winner=true,  status='settled' WHERE pubkey='ALICE_POS'
UPDATE positions SET payout=17_952_380, is_winner=true,  status='settled' WHERE pubkey='BOB_POS'
UPDATE positions SET payout=0,          is_winner=false, status='settled' WHERE pubkey='CAROL_POS'
UPDATE positions SET payout=0,          is_winner=false, status='settled' WHERE pubkey='DAN_POS'`}
      </FlowRow>
    </div>,
    claim: <div key="claim">
      <FlowRow who="📱 frontend  GET /users/ALICE/claimable" cls="f">
{`[{
  market:  "Will BTC close above $100k?",
  stake:   "$50.00",  payout: "$89.76",  profit: "+$39.76",
  status:  "settled",  market_type: "yesno"
}]
// UI: "Claim $89.76" button — same for all 3 market types`}
      </FlowRow>
      <Arrow label="Alice clicks Claim"/>
      <FlowRow who="👤 user — same instruction all 3 types" cls="u">
{`program.methods.claimPayout().accounts({
  user: ALICE_WALLET,  position: ALICE_POS,
  pool: UNIFIED_POOL,  pool_vault: UNIFIED_VAULT,
  user_usdc: ALICE_USDC,
}).rpc()`}
      </FlowRow>
      <Arrow/>
      <FlowRow who="⛓ contract" cls="c">
{`token::transfer(pool_vault → alice_usdc, 89_761_904)
position.status = Claimed
// PayoutClaimed event emitted`}
      </FlowRow>
      <div style={{marginTop:8,background:'rgba(0,232,122,.08)',border:'1px solid rgba(0,232,122,.2)',padding:'7px 12px',borderRadius:4,fontSize:12,color:'#00e87a',fontFamily:'IBM Plex Mono,monospace'}}>
        Alice receives $89.76 USDC. On-chain and final.
      </div>
      <FlowRow who="🤖 backend" cls="b">
{`UPDATE positions SET status='claimed', claimed_at=now WHERE pubkey='ALICE_POS'`}
      </FlowRow>
    </div>,
  }

  return (
    <section id="flow">
      <div className="section-tag">// data flow</div>
      <h2>From bet to payout</h2>
      <p className="section-sub">Every step for all three market types. What the user sends, what goes on-chain, what the backend stores, what the contract executes.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'6px 14px',borderRadius:4,border:'1px solid',cursor:'pointer',
            fontFamily:'IBM Plex Mono,monospace',fontSize:11,letterSpacing:'.04em',
            background: tab===t.id ? 'rgba(0,232,122,.1)' : '#141414',
            color: tab===t.id ? '#00e87a' : '#6a6860',
            borderColor: tab===t.id ? '#00e87a' : '#222',
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12}}>
        {content[tab]}
      </div>
    </section>
  )
}

// ─── Protocol Spec Section ───────────────────────────────────────────────────

type ProtocolTab = 'instructions' | 'backend' | 'accounts'

function ProtocolSection() {
  const [tab, setTab] = useState<ProtocolTab>('instructions')
  const tabs: { id: ProtocolTab; label: string }[] = [
    {id:'instructions',label:'25 instructions'},
    {id:'backend',label:'Backend — endpoints + crons'},
    {id:'accounts',label:'10 on-chain accounts'},
  ]

  const Pill = ({t,cls}:{t:string,cls:string})=>{
    const styles:Record<string,React.CSSProperties> = {
      fe:{background:'rgba(0,232,122,.1)',color:'#00e87a',border:'1px solid #00e87a'},
      be:{background:'rgba(0,180,255,.1)',color:'#00b4ff',border:'1px solid #00b4ff'},
      ar:{background:'rgba(167,139,250,.1)',color:'#a78bfa',border:'1px solid #a78bfa'},
      ad:{background:'rgba(106,104,96,.2)',color:'#b8b4ac',border:'1px solid #444'},
      any:{background:'rgba(106,104,96,.1)',color:'#6a6860',border:'1px solid #333'},
    }
    return <span style={{display:'inline-block',fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:600,letterSpacing:'.06em',...styles[cls]}}>{t}</span>
  }

  const TH = ({children}:{children:React.ReactNode})=>(
    <th style={{textAlign:'left',padding:'6px 8px',fontSize:10,letterSpacing:'.06em',textTransform:'uppercase' as const,color:'#6a6860',borderBottom:'2px solid #222',fontWeight:400}}>{children}</th>
  )
  const TD = ({children,style={}}:{children:React.ReactNode,style?:React.CSSProperties})=>(
    <td style={{padding:'7px 8px',borderBottom:'1px solid #111',verticalAlign:'top' as const,lineHeight:1.6,...style}}>{children}</td>
  )

  const instructions = [
    {n:1,name:'initialize',who:'ad',desc:'Creates global CyperMarket PDA. Sets fee bps, treasury, authority.'},
    {n:2,name:'init_yesno_comp_def',who:'ad',desc:'Registers YesNo equality-check circuit with Arcium.'},
    {n:3,name:'init_multioutcome_comp_def',who:'ad',desc:'Registers MultiOutcome circuit.'},
    {n:4,name:'init_accuracy_comp_def',who:'ad',desc:'Registers Accuracy error circuit.'},
    {n:5,name:'create_market_group',who:'fe',desc:'Creates MarketGroup PDA. Locks $10 USDC bond. Sets question, oracle, timestamps.'},
    {n:6,name:'create_flat_market',who:'fe',desc:'YesNo + MultiOutcome only. Creates Market PDA with bet_size=0 (variable stakes). Called once per group.'},
    {n:7,name:'create_tier_market',who:'fe',desc:'Accuracy only. Called 3× (Micro/Standard/Whale). Each creates Market PDA with fixed bet_size.'},
    {n:8,name:'create_pool',who:'fe',desc:'Creates Pool PDA + USDC vault. YesNo/Multi: 1 unified pool. Accuracy: 1 per tier = 3 calls.'},
    {n:9,name:'cancel_market',who:'fe',desc:"Creator cancels before any bets placed. Returns bond. Only if participants == 0."},
    {n:10,name:'place_bet',who:'fe',desc:'YesNo + MultiOutcome. User passes encrypted_payload + stake_amount. USDC → vault. Creates Position PDA.'},
    {n:11,name:'place_bet_accuracy',who:'fe',desc:'Accuracy only. No stake param — enforces exact tier bet_size. Creates Position PDA.'},
    {n:12,name:'lock_market',who:'any',desc:'Closes betting after lock_timestamp. Backend cron calls first. Any user can call as fallback.'},
    {n:13,name:'post_resolution',who:'be/fe',desc:'Pyth: oracle service signs. Manual: creator signs from frontend. Starts 1hr dispute window.'},
    {n:14,name:'init_settlement_registry',who:'be',desc:'Creates SettlementRegistry PDA after dispute window. Sets total_shards = ceil(count/8).'},
    {n:15,name:'queue_settlement_yesno',who:'be',desc:'Sends one shard (≤8 encrypted sides) to Arcium. Called N times in parallel. One per shard.'},
    {n:16,name:'queue_settlement_multioutcome',who:'be',desc:'Same pattern as YesNo. Passes encrypted outcome indices. All shards in parallel.'},
    {n:17,name:'queue_settlement_accuracy',who:'be',desc:'Same pattern. Circuit outputs errors not winner flags.'},
    {n:18,name:'settle_yesno_callback',who:'ar',desc:'Auto-called by MXE. Verifies ZK proof. Emits winner_mask. Updates registry. Sends LP+protocol fees.'},
    {n:19,name:'settle_multioutcome_callback',who:'ar',desc:'Identical to YesNo callback.'},
    {n:20,name:'settle_accuracy_callback',who:'ar',desc:'Emits errors (not winner flags). Updates registry. No fees — sent via accuracy_send_fees.'},
    {n:21,name:'accuracy_send_fees',who:'be',desc:'Accuracy only. Sends 20% platform fee of loser pool to treasury after backend computes loser count.'},
    {n:22,name:'write_position_payout',who:'be',desc:'Writes computed payout to one Position PDA. Called once per position. Idempotent — safe to retry.'},
    {n:23,name:'claim_payout',who:'fe',desc:'User pulls USDC from pool vault to wallet. Only works if position.status == Settled.'},
    {n:24,name:'return_bond',who:'fe',desc:'Creator reclaims $10 bond after group.status == Settled.'},
    {n:25,name:'slash_bond',who:'any',desc:'Permissionless. Sends bond to treasury if creator missed resolve_deadline.'},
  ]

  const whoLabel:Record<string,string> = {fe:'frontend',be:'backend','be/fe':'be/fe',ar:'arcium',ad:'admin',any:'anyone'}

  const accounts = [
    {n:1,name:'CyperMarket PDA',seeds:'["cyper_market"]',owner:'program',count:'1 total',stores:'authority, treasury pubkey, fee bps (protocol/LP/accuracy), market_count, is_paused'},
    {n:2,name:'MarketGroup PDA',seeds:'["market_group", config, group_index]',owner:'program',count:'1 per market',stores:'question, market_type, creator, oracle, lock_timestamp, resolve_deadline, status, resolved_value, dispute_deadline, bond_status'},
    {n:3,name:'Market PDA',seeds:'["market", group, tier_byte]',owner:'program',count:'1 (YesNo/Multi) or 3 (Accuracy) per group',stores:'market_type, tier, bet_size (0=variable), fee_bps, pools vec, total_participants, total_volume, status'},
    {n:4,name:'Pool PDA',seeds:'["pool", market, pool_index]',owner:'program',count:'1 (YesNo/Multi) or 1 per tier (Accuracy)',stores:'pool_type (Unified/Accuracy), vault pubkey, participant_count, total_staked, status (Open→Settling→Settled)'},
    {n:5,name:'Pool vault',seeds:'["vault", pool]',owner:'SPL Token',count:'1 per pool',stores:'USDC token account. Holds all user stakes. Authority = vault_authority PDA. Nobody withdraws without program signing.'},
    {n:6,name:'Vault authority',seeds:'["vault_authority", pool]',owner:'program',count:'1 per pool',stores:'Empty PDA — exists only as signer for token transfers out of vault. No data stored.'},
    {n:7,name:'Position PDA',seeds:'["position", pool, user]',owner:'program',count:'1 per user per pool',stores:'pool, market, group, user pubkey, encrypted_payload (Vec<u8>), stake, placed_at, payout (0 until settlement), status (Open→Settled→Claimed)'},
    {n:8,name:'Bond PDA',seeds:'["bond", group]',owner:'program',count:'1 per group',stores:'creator, amount ($10), vault pubkey, status (Locked→Returned/Slashed)'},
    {n:9,name:'Bond vault',seeds:'["bond_vault", group]',owner:'SPL Token',count:'1 per group',stores:'USDC token account. Holds creator $10 bond. Separate from pool vault — never mixed with user stakes.'},
    {n:10,name:'SettlementRegistry PDA',seeds:'["settlement_registry", pool]',owner:'program',count:'1 per pool at settlement',stores:'total_shards, settled_shards, status (InProgress→Finalizing→Complete). Backend monitors for Finalizing.'},
  ]

  return (
    <section id="protocol">
      <div className="section-tag">// protocol spec</div>
      <h2>Every moving part</h2>
      <p className="section-sub">All 25 on-chain instructions, the complete backend surface, and every account the protocol creates.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'6px 14px',borderRadius:4,border:'1px solid',cursor:'pointer',
            fontFamily:'IBM Plex Mono,monospace',fontSize:11,letterSpacing:'.04em',
            background: tab===t.id ? 'rgba(0,232,122,.1)' : '#141414',
            color: tab===t.id ? '#00e87a' : '#6a6860',
            borderColor: tab===t.id ? '#00e87a' : '#222',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'instructions' && (
        <div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14,fontSize:11,fontFamily:'IBM Plex Mono,monospace'}}>
            {[['fe','frontend'],['be','backend'],['ar','arcium'],['ad','admin'],['any','anyone']].map(([k,v])=>(
              <span key={k}><Pill t={v} cls={k}/></span>
            ))}
          </div>
          {[
            {label:'admin — run once at deploy (4)',nums:[1,2,3,4]},
            {label:'market creation — creator via frontend (5)',nums:[5,6,7,8,9]},
            {label:'betting — user via frontend (2)',nums:[10,11]},
            {label:'lifecycle — backend + permissionless (3)',nums:[12,13,14]},
            {label:'settlement — backend queues, arcium executes (6)',nums:[15,16,17,18,19,20]},
            {label:'payout + cleanup (5)',nums:[21,22,23,24,25]},
          ].map(group=>(
            <div key={group.label} style={{marginBottom:20}}>
              <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'10px 0 6px',borderBottom:'1px solid #222',marginBottom:4,fontFamily:'IBM Plex Mono,monospace'}}>{group.label}</div>
              <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12}}>
                <thead><tr><TH>#</TH><TH>instruction</TH><TH>caller</TH><TH>what it does</TH></tr></thead>
                <tbody>
                  {instructions.filter(i=>group.nums.includes(i.n)).map(ix=>(
                    <tr key={ix.n} style={{fontFamily:'IBM Plex Mono,monospace'}}>
                      <TD style={{color:'#6a6860'}}>{ix.n}</TD>
                      <TD style={{color:'#f0ece4',fontWeight:500}}>{ix.name}</TD>
                      <TD><Pill t={whoLabel[ix.who]||ix.who} cls={ix.who.split('/')[0]}/></TD>
                      <TD style={{color:'#b8b4ac'}}>{ix.desc}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'backend' && (
        <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12}}>
          <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'8px 0 6px',borderBottom:'1px solid #222',marginBottom:4}}>REST API endpoints (9)</div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12,marginBottom:24}}>
            <thead><tr><TH>method</TH><TH>endpoint</TH><TH>returns</TH><TH>source</TH></tr></thead>
            <tbody>
              {[
                {m:'GET',e:'/markets',r:'all markets with status + volume',s:'DB'},
                {m:'GET',e:'/markets/:id',r:'market detail, pool totals, timing',s:'DB'},
                {m:'GET',e:'/markets/:id/positions',r:'all positions (stake only, no sides)',s:'DB'},
                {m:'GET',e:'/users/:wallet/positions',r:"user's open positions",s:'DB'},
                {m:'GET',e:'/users/:wallet/claimable',r:'settled positions with payout > 0',s:'DB'},
                {m:'GET',e:'/leaderboard',r:'accuracy scores ranked',s:'DB'},
                {m:'GET',e:'/health',r:'server + chain indexer status',s:'live'},
                {m:'POST',e:'/markets',r:'unsigned tx for frontend to sign',s:'builds tx'},
                {m:'POST',e:'/markets/:id/resolve',r:'unsigned tx for creator (manual)',s:'builds tx'},
              ].map((row,i)=>(
                <tr key={i}>
                  <TD style={{color:row.m==='GET'?'#00e87a':'#f5a623'}}>{row.m}</TD>
                  <TD style={{color:'#f0ece4',fontWeight:500}}>{row.e}</TD>
                  <TD style={{color:'#b8b4ac'}}>{row.r}</TD>
                  <TD style={{color:'#6a6860'}}>{row.s}</TD>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'8px 0 6px',borderBottom:'1px solid #222',marginBottom:4}}>cron jobs (3)</div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12,marginBottom:24}}>
            <thead><tr><TH>cron</TH><TH>interval</TH><TH>logic</TH><TH>calls</TH></tr></thead>
            <tbody>
              {[
                {c:'lock_cron',i:'every 60s',l:'Open markets where now ≥ lock_timestamp','k':'lock_market'},
                {c:'slash_cron',i:'every 60s',l:'Locked markets where now > resolve_deadline','k':'slash_bond'},
                {c:'settlement_trigger',i:'event-driven',l:'ResolutionPosted + dispute_deadline passed','k':'init_settlement_registry → queue_settlement_*'},
              ].map((r,i)=>(
                <tr key={i}>
                  <TD style={{color:'#f0ece4',fontWeight:500}}>{r.c}</TD>
                  <TD style={{color:'#00e87a'}}>{r.i}</TD>
                  <TD style={{color:'#b8b4ac'}}>{r.l}</TD>
                  <TD style={{color:'#7b5cfa'}}>{r.k}</TD>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'8px 0 6px',borderBottom:'1px solid #222',marginBottom:4}}>background services (4)</div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12,marginBottom:24}}>
            <thead><tr><TH>service</TH><TH>what it does</TH><TH>calls instructions</TH></tr></thead>
            <tbody>
              {[
                {s:'chain_indexer',w:'subscribes to all program events, keeps DB in sync',c:'read-only'},
                {s:'oracle_service',w:'reads Pyth feed after lock, posts resolution',c:'post_resolution'},
                {s:'settlement_coordinator',w:'groups positions into shards, queues Arcium jobs in parallel, monitors registry',c:'init_settlement_registry, queue_settlement_*'},
                {s:'payout_writer',w:'triggered by RegistryFinalized, computes payouts from public data, writes to chain',c:'accuracy_send_fees, write_position_payout'},
              ].map((r,i)=>(
                <tr key={i}>
                  <TD style={{color:'#f0ece4',fontWeight:500}}>{r.s}</TD>
                  <TD style={{color:'#b8b4ac'}}>{r.w}</TD>
                  <TD style={{color:'#7b5cfa'}}>{r.c}</TD>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'8px 0 6px',borderBottom:'1px solid #222',marginBottom:4}}>who calls what</div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12}}>
            <thead><tr><TH>caller</TH><TH>instructions</TH><TH>count</TH></tr></thead>
            <tbody>
              {[
                {who:'fe',label:'frontend (user wallet)',ix:'create_market_group, create_flat_market, create_tier_market, create_pool, cancel_market, place_bet, place_bet_accuracy, post_resolution (manual), claim_payout, return_bond',n:10},
                {who:'be',label:'backend (server keypair)',ix:'post_resolution (Pyth), init_settlement_registry, queue_settlement_yesno, queue_settlement_multioutcome, queue_settlement_accuracy, accuracy_send_fees, write_position_payout',n:7},
                {who:'ar',label:'arcium MXE (auto)',ix:'settle_yesno_callback, settle_multioutcome_callback, settle_accuracy_callback',n:3},
                {who:'ad',label:'admin (deploy wallet)',ix:'initialize, init_yesno_comp_def, init_multioutcome_comp_def, init_accuracy_comp_def',n:4},
                {who:'any',label:'anyone (permissionless)',ix:'lock_market, slash_bond',n:2},
              ].map((r,i)=>(
                <tr key={i}>
                  <TD><Pill t={r.label} cls={r.who}/></TD>
                  <TD style={{color:'#b8b4ac'}}>{r.ix}</TD>
                  <TD style={{color:'#f0ece4',fontWeight:500}}>{r.n}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'accounts' && (
        <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12}}>
          <div style={{background:'rgba(0,180,255,.08)',border:'1px solid rgba(0,180,255,.2)',padding:'7px 12px',borderRadius:4,fontSize:12,color:'#00b4ff',marginBottom:12}}>
            In Solana, "owned by" means which program can write to the account. All PDAs owned by Cypher program. Token accounts owned by SPL Token but controlled via PDA authority.
          </div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:11}}>
            <thead><tr><TH>#</TH><TH>account</TH><TH>seeds</TH><TH>owner</TH><TH>count</TH><TH>stores</TH></tr></thead>
            <tbody>
              {accounts.map(a=>(
                <tr key={a.n}>
                  <TD style={{color:'#6a6860'}}>{a.n}</TD>
                  <TD style={{color:'#f0ece4',fontWeight:500}}>{a.name}</TD>
                  <TD style={{color:'#6a6860',fontSize:10}}>{a.seeds}</TD>
                  <TD style={{color:a.owner==='program'?'#00e87a':'#00b4ff'}}>{a.owner}</TD>
                  <TD style={{color:'#b8b4ac',fontSize:10}}>{a.count}</TD>
                  <TD style={{color:'#b8b4ac',fontSize:10,lineHeight:1.6}}>{a.stores}</TD>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'16px 0 6px',borderBottom:'1px solid #222',marginBottom:4}}>PDAs per market — how many total</div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12,marginBottom:20}}>
            <thead><tr><TH>market type</TH><TH>PDAs</TH><TH>token accounts</TH><TH>total</TH></tr></thead>
            <tbody>
              {[
                {t:'YesNo',td:'MarketGroup+Market+Pool+Bond+Registry = 5+N positions',ta:'Pool vault+Bond vault = 2',tot:'7+N'},
                {t:'MultiOutcome',td:'Same as YesNo = 5+N',ta:'2',tot:'7+N'},
                {t:'Accuracy',td:'MarketGroup+Market×3+Pool×3+Bond+Registry×3 = 10+N',ta:'Pool vault×3+Bond vault = 4',tot:'14+N'},
              ].map((r,i)=>(
                <tr key={i}>
                  <TD style={{color:'#f0ece4'}}>{r.t}</TD>
                  <TD style={{color:'#b8b4ac'}}>{r.td}</TD>
                  <TD style={{color:'#b8b4ac'}}>{r.ta}</TD>
                  <TD style={{color:'#00e87a',fontWeight:500}}>{r.tot} positions</TD>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase' as const,color:'#6a6860',padding:'8px 0 6px',borderBottom:'1px solid #222',marginBottom:4}}>permission model — who controls what</div>
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:11}}>
            <thead><tr><TH>role</TH><TH>controls</TH><TH>cannot touch</TH></tr></thead>
            <tbody>
              {[
                {r:'Admin wallet',c:'CyperMarket config, pause flag, fee rates',n:'any user funds, positions, market outcomes'},
                {r:'Creator wallet',c:'create/cancel their markets, post_resolution (manual), return own bond',n:'other markets, user positions, anyone else\'s bond'},
                {r:'User wallet',c:'their own Position — place_bet, claim_payout',n:'other users\' positions, vault funds directly'},
                {r:'Backend keypair',c:'settlement flow only — init_registry, queue_settlement, write_payout',n:'vault funds directly, user positions ownership'},
                {r:'Arcium MXE',c:'settle_*_callback — writes to registry, sends fees via CPI',n:'everything else'},
                {r:'Anyone',c:'lock_market (after timestamp), slash_bond (after deadline)',n:'everything else'},
              ].map((r,i)=>(
                <tr key={i}>
                  <TD style={{color:'#f0ece4',fontWeight:500}}>{r.r}</TD>
                  <TD style={{color:'#b8b4ac'}}>{r.c}</TD>
                  <TD style={{color:'#6a6860'}}>{r.n}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function FlowRow({who,cls,children}:{who:string,cls:string,children:string}) {
  const lhStyle:Record<string,React.CSSProperties> = {
    u:{background:'rgba(0,232,122,.08)',color:'#00e87a',borderBottom:'1px solid rgba(0,232,122,.15)'},
    c:{background:'rgba(0,180,255,.08)',color:'#00b4ff',borderBottom:'1px solid rgba(0,180,255,.15)'},
    b:{background:'rgba(106,104,96,.1)',color:'#b8b4ac',borderBottom:'1px solid #222'},
    f:{background:'rgba(106,104,96,.08)',color:'#6a6860',borderBottom:'1px solid #1a1a1a'},
    arc:{background:'rgba(167,139,250,.08)',color:'#a78bfa',borderBottom:'1px solid rgba(167,139,250,.2)'},
  }
  return (
    <div style={{border:'1px solid #1e1e1e',borderRadius:4,marginBottom:7,overflow:'hidden'}}>
      <div style={{padding:'5px 12px',fontSize:10,letterSpacing:'.07em',textTransform:'uppercase' as const,fontWeight:500,...lhStyle[cls]}}>{who}</div>
      <div style={{padding:'9px 12px',overflowX:'auto' as const}}>
        <pre style={{fontSize:11,lineHeight:1.85,margin:0,color:'#b8b4ac',whiteSpace:'pre'}}>{children}</pre>
      </div>
    </div>
  )
}

function FlowLabel({label,color,mt=0}:{label:string,color:string,mt?:number}) {
  return <div style={{fontSize:11,fontFamily:'IBM Plex Mono,monospace',color,letterSpacing:'.06em',marginTop:mt,marginBottom:6}}>// {label}</div>
}

function Arrow({label}:{label?:string}) {
  return <div style={{textAlign:'center' as const,color:'#333',fontSize:14,padding:'2px 0',fontFamily:'IBM Plex Mono,monospace'}}>
    {label ? `↓ ${label} ↓` : '↓'}
  </div>
}

function DiffBox({old:o,oldCode,nw,newCode}:{old:string,oldCode:string,nw:string,newCode:string}) {
  return (
    <div style={{border:'1px solid #1e1e1e',borderRadius:4,marginBottom:12,overflow:'hidden',fontSize:11,fontFamily:'IBM Plex Mono,monospace'}}>
      <div style={{padding:'5px 12px',background:'rgba(255,68,68,.08)',color:'#ff4444',fontSize:10,letterSpacing:'.06em'}}>✗ {o}</div>
      <div style={{padding:'7px 12px',color:'#ff4444',textDecoration:'line-through' as const,opacity:.7}}>{oldCode}</div>
      <div style={{padding:'5px 12px',background:'rgba(0,232,122,.08)',color:'#00e87a',fontSize:10,letterSpacing:'.06em'}}>✓ {nw}</div>
      <div style={{padding:'7px 12px',color:'#00e87a'}}>{newCode}</div>
    </div>
  )
}

// ─── Main Site Page ───────────────────────────────────────────────────────────

export default function SitePage() {
  const [archTab, setArchTab] = useState<'flow' | 'split' | 'pdas'>('flow')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i)

  const faqs = [
    {q:"Why can't anyone see other people's bets?",a:"Every prediction is encrypted with the Arcium MXE public key client-side in your browser before it's submitted. The encrypted blob is stored on-chain. Nobody — not other users, not validators, not even Cypher — can decrypt it without the MXE's private key shards, which are split across multiple MPC nodes and only combined inside the secure computation at settlement."},
    {q:"What stops a creator from posting a wrong resolution?",a:"Three things: a $10 USDC bond (slashed if they misbehave), a 1-hour dispute window after any resolution, and Pyth on-chain price feeds for crypto markets which require no human input at all. For custom markets, the bond + dispute window is the protection layer."},
    {q:"How many outcomes can a multi-outcome market have?",a:"Between 2 and 4 outcomes in v1. All bettors go into one unified pool — the pool address reveals nothing about which outcome you picked. Only Arcium decrypts the outcome at settlement."},
    {q:"Can I bet any amount on binary and multi-outcome markets?",a:"Yes — binary and multi-outcome markets have variable stakes. You choose any amount above a small minimum. The more you stake on the winning side, the larger your proportional share of the loser pool. Accuracy markets are different — they use fixed entry fees per tier ($1/$10/$100) so skill, not wallet size, determines your payout share."},
    {q:"What token is used?",a:"USDC only, across all market types. Stable value means your $10 bet is worth $10 at settlement. If you only have SOL, swap on Jupiter first — one click, 5 seconds."},
    {q:"How does settlement scale to many users?",a:"Settlement uses parallel sharding. Positions are grouped into shards of 8. Each shard runs as a separate Arcium job simultaneously. A SettlementRegistry on-chain accumulates results as jobs complete. For 10,000 users that's 1,250 parallel jobs — wall-clock settlement time stays roughly constant."},
    {q:"What happens if nobody bets on the winning side?",a:"Edge case handled — if winner_count is 0, the entire net pool goes to protocol treasury to prevent permanent fund lock. For accuracy markets this cannot happen — the top ~50% always win by definition of the median cutoff."},
    {q:"Is the contract upgradeable?",a:"Yes, with a multisig upgrade authority. No single key can upgrade the program. All accounts have reserved padding bytes so upgrades don't require migrating existing market data."},
    {q:"How do I run the project locally?",a:"Install Bun from bun.sh, then: bun install && bun run dev. The math simulator runs at localhost:3000 and the site at localhost:3000/site. No environment variables needed for the simulator."},
  ]

  return (
    <>
      <style>{`
        .cy *,.cy *::before,.cy *::after{box-sizing:border-box;margin:0;padding:0}
        .cy{--black:#0a0a0a;--white:#f5f2eb;--green:#00e87a;--green-dim:#00e87a22;--purple:#7b5cfa;--purple-dim:#7b5cfa22;--amber:#f5a623;--amber-dim:#f5a62322;--red:#ff4444;--blue:#00b4ff;--gray:#141414;--gray2:#1e1e1e;--gray3:#2a2a2a;--text:#b8b4ac;--text2:#6a6860;--mono:'IBM Plex Mono',monospace;--sans:'Instrument Sans',sans-serif;--display:'Syne',sans-serif;--border:1px solid #222;background:var(--black);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.6;overflow-x:hidden}
        .cy a{text-decoration:none}
        .cy section{padding:100px 40px;border-top:var(--border)}
        .cy h2{font-family:var(--display);font-weight:700;font-size:clamp(32px,5vw,54px);color:var(--white);line-height:1.05;letter-spacing:-1.5px;margin-bottom:20px}
        .cy h3{font-family:var(--display);font-weight:600;font-size:21px;color:var(--white);letter-spacing:-.4px;margin-bottom:10px}
        .cy .section-tag{font-family:var(--mono);font-size:11px;color:var(--green);letter-spacing:.15em;text-transform:uppercase;margin-bottom:16px}
        .cy .section-sub{font-size:16px;color:var(--text);max-width:580px;line-height:1.65;margin-bottom:56px}
        .cy .market-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
        .cy .market-card{background:var(--gray);padding:36px 32px;position:relative;overflow:hidden;transition:background .25s}
        .cy .market-card:hover{background:var(--gray2)}
        .cy .market-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent,var(--green))}
        .cy .binary{--accent:var(--green)}.cy .accuracy{--accent:var(--purple)}.cy .multi{--accent:var(--amber)}
        .cy .market-num{font-family:var(--mono);font-size:56px;font-weight:300;color:var(--gray3);line-height:1;margin-bottom:24px}
        .cy .market-type-badge{display:inline-block;font-family:var(--mono);font-size:10px;padding:4px 10px;margin-bottom:16px;letter-spacing:.1em;text-transform:uppercase}
        .cy .binary .market-type-badge{background:var(--green-dim);color:var(--green);border:1px solid var(--green)}
        .cy .accuracy .market-type-badge{background:var(--purple-dim);color:var(--purple);border:1px solid var(--purple)}
        .cy .multi .market-type-badge{background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber)}
        .cy .stake-badge{display:inline-block;font-family:var(--mono);font-size:9px;padding:2px 7px;margin-left:8px;letter-spacing:.08em;text-transform:uppercase;border:1px solid;vertical-align:middle}
        .cy .stake-var{color:var(--green);border-color:var(--green);background:var(--green-dim)}
        .cy .stake-fixed{color:var(--purple);border-color:var(--purple);background:var(--purple-dim)}
        .cy .market-question{font-size:15px;color:var(--text);margin-bottom:24px;line-height:1.5}
        .cy .market-detail{font-family:var(--mono);font-size:11px;color:var(--text2);margin-bottom:6px}
        .cy .market-detail span{color:var(--white)}
        .cy .pool-row{display:flex;gap:6px;margin-top:24px;padding-top:24px;border-top:var(--border)}
        .cy .pool-pill{flex:1;text-align:center;padding:8px 6px;background:var(--gray2);font-family:var(--mono);font-size:10px}
        .cy .pool-pill.yes{color:var(--green)}.cy .pool-pill.no{color:var(--red)}.cy .pool-pill.outcome{color:var(--amber)}.cy .pool-pill.acc{color:var(--purple)}
        .cy .tier-badges{display:flex;gap:6px;margin-top:14px}
        .cy .tier-badge{font-family:var(--mono);font-size:10px;padding:3px 8px;background:var(--gray2);color:var(--text2)}
        .cy .tier-badge.active{color:var(--white);background:var(--gray3)}
        .cy .tier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
        .cy .tier-card{background:var(--gray);padding:40px 32px;position:relative;text-align:center}
        .cy .tier-amount{font-family:var(--display);font-weight:800;font-size:56px;color:var(--white);letter-spacing:-2px;line-height:1;margin-bottom:8px}
        .cy .tier-name{font-family:var(--mono);font-size:11px;color:var(--text2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:28px}
        .cy .tier-feature{font-size:13px;color:var(--text);margin-bottom:8px}
        .cy .tier-sep{height:1px;background:var(--gray3);margin:20px 0}
        .cy .arch-tabs{display:flex;gap:0;border-bottom:var(--border);margin-bottom:48px}
        .cy .arch-tab{font-family:var(--mono);font-size:11px;padding:12px 22px;background:transparent;color:var(--text2);border:none;border-bottom:2px solid transparent;cursor:pointer;letter-spacing:.05em;transition:all .2s}
        .cy .arch-tab.active{color:var(--green);border-bottom-color:var(--green)}
        .cy .flow-row{display:flex;gap:0;align-items:stretch;margin-bottom:2px}
        .cy .flow-node{flex:1;padding:20px 22px;background:var(--gray);border:1px solid transparent;position:relative;transition:all .25s}
        .cy .flow-node:hover{background:var(--gray2);border-color:var(--gray3)}
        .cy .flow-node.g{border-top:2px solid var(--green)}.cy .flow-node.p{border-top:2px solid var(--purple)}.cy .flow-node.a{border-top:2px solid var(--amber)}.cy .flow-node.r{border-top:2px solid var(--red)}.cy .flow-node.b{border-top:2px solid var(--blue)}.cy .flow-node.teal{border-top:2px solid #00d4aa}
        .cy .fn-who{font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.06em;margin-bottom:7px}
        .cy .fn-title{font-family:var(--display);font-weight:600;font-size:15px;color:var(--white);margin-bottom:5px}
        .cy .fn-desc{font-size:12px;color:var(--text);line-height:1.5}
        .cy .fn-new{font-family:var(--mono);font-size:9px;padding:2px 6px;background:rgba(0,232,122,.15);color:var(--green);border:1px solid var(--green);display:inline-block;margin-top:6px}
        .cy .arch-diagram{background:var(--gray);padding:32px;border:var(--border);margin-bottom:2px}
        .cy .arch-layer{margin-bottom:12px}
        .cy .arch-layer-label{font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}
        .cy .arch-boxes{display:grid;gap:2px}
        .cy .arch-box{background:var(--gray2);padding:14px 16px;border-left:2px solid;position:relative}
        .cy .arch-box.green{border-color:var(--green)}.cy .arch-box.purple{border-color:var(--purple)}.cy .arch-box.amber{border-color:var(--amber)}.cy .arch-box.blue{border-color:var(--blue)}.cy .arch-box.teal{border-color:#00d4aa}
        .cy .arch-box-title{font-family:var(--mono);font-size:12px;color:var(--white);margin-bottom:3px}
        .cy .arch-box-sub{font-size:11px;color:var(--text2)}
        .cy .arch-new-badge{font-family:var(--mono);font-size:9px;padding:1px 5px;background:rgba(0,232,122,.12);color:var(--green);border:1px solid var(--green);margin-left:8px}
        .cy .arch-changed-badge{font-family:var(--mono);font-size:9px;padding:1px 5px;background:rgba(245,166,35,.12);color:var(--amber);border:1px solid var(--amber);margin-left:8px}
        .cy .arch-arrow{text-align:center;color:var(--text2);font-size:12px;padding:6px 0;font-family:var(--mono)}
        .cy .encrypt-box{background:var(--gray);padding:40px;border:var(--border)}
        .cy .encrypt-flow{display:grid;grid-template-columns:1fr 40px 1fr 40px 1fr;gap:0;align-items:center}
        .cy .ef-node{padding:22px 18px;background:var(--gray2);text-align:center}
        .cy .ef-arrow{text-align:center;font-family:var(--mono);font-size:18px;color:var(--gray3)}
        .cy .ef-label{font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.08em;margin-bottom:8px}
        .cy .ef-encrypted{font-family:var(--mono);font-size:10px;color:var(--purple);word-break:break-all;line-height:1.5}
        .cy .ef-result{font-family:var(--mono);font-size:12px;color:var(--green);line-height:1.8}
        .cy .faq-item{border-bottom:var(--border)}
        .cy .faq-q{display:flex;justify-content:space-between;align-items:center;padding:22px 0;cursor:pointer;transition:color .2s;font-size:15px;color:var(--white);font-weight:500;gap:16px}
        .cy .faq-q:hover{color:var(--green)}
        .cy .faq-icon{font-family:var(--mono);font-size:20px;color:var(--text2);transition:transform .25s;flex-shrink:0}
        .cy .faq-a{overflow:hidden;transition:max-height .3s ease}
        .cy .faq-a p{font-size:14px;color:var(--text);line-height:1.7;padding-bottom:22px;max-width:720px}
        .cy .code-block{font-family:var(--mono);font-size:11px;color:var(--text);background:var(--gray);padding:14px 18px;border-left:2px solid;line-height:2;margin-top:12px;display:block}
        .cy .code-block.g{border-color:var(--green)}.cy .code-block.p{border-color:var(--purple)}.cy .code-block.a{border-color:var(--amber)}
        .cy .tag-sm{display:inline-block;font-family:var(--mono);font-size:10px;padding:2px 8px;letter-spacing:.06em}
        .cy .tag-g{background:var(--green-dim);color:var(--green);border:1px solid var(--green)}
        .cy .tag-p{background:var(--purple-dim);color:var(--purple);border:1px solid var(--purple)}
        .cy .tag-a{background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber)}
        .cy .state-machine{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:40px}
        .cy .sm-state{padding:9px 18px;background:var(--gray);font-family:var(--mono);font-size:12px;color:var(--white);border:1px solid var(--gray3)}
        .cy .sm-state.s-open{border-color:var(--green);color:var(--green)}.cy .sm-state.s-locked{border-color:var(--amber);color:var(--amber)}.cy .sm-state.s-resolving{border-color:var(--purple);color:var(--purple)}.cy .sm-state.s-settling{border-color:var(--blue);color:var(--blue)}.cy .sm-state.s-settled{border-color:var(--green);background:var(--green-dim);color:var(--green)}.cy .sm-state.s-voided{border-color:var(--red);color:var(--red)}
        .cy .sm-arrow{font-size:16px;color:var(--text2)}
        .cy .timeline{position:relative;padding-left:40px}
        .cy .timeline::before{content:'';position:absolute;left:8px;top:0;bottom:0;width:1px;background:var(--gray3)}
        .cy .tl-item{position:relative;margin-bottom:48px}
        .cy .tl-dot{position:absolute;left:-39px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--black);border:2px solid var(--green)}
        .cy .tl-label{font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}
        .cy .tl-title{font-family:var(--display);font-weight:600;font-size:20px;color:var(--white);margin-bottom:8px;letter-spacing:-.3px}
        .cy .tl-desc{font-size:14px;color:var(--text);line-height:1.65;max-width:640px}
        .cy .tl-code{font-family:var(--mono);font-size:11px;color:var(--text2);background:var(--gray);padding:10px 16px;margin-top:12px;border-left:2px solid;line-height:1.8;display:inline-block;max-width:100%;word-break:break-word}
        @media(max-width:880px){.cy .market-grid,.cy .tier-grid,.cy .encrypt-flow,.cy .flow-row{grid-template-columns:1fr}.cy .ef-arrow{display:none}.cy section{padding:70px 20px}}
      `}</style>

      <div className="cy">
        {/* NAV */}
        <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 40px',height:60,background:'rgba(10,10,10,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #222'}}>
          <a href="/site" style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#f5f2eb',letterSpacing:-0.5}}>
            CYPHER<span style={{color:'#00e87a'}}>.</span>
          </a>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            {[['#markets','Markets'],['#how','Lifecycle'],['#flow','Data flow'],['#protocol','Protocol'],['#arch','Architecture'],['#encryption','Encryption'],['#math','Math'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,color:'#6a6860'}}>{label}</a>
            ))}
          </div>
          <a href="/" style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,padding:'8px 14px',border:'1px solid #222',color:'#b8b4ac'}}>Math Sim →</a>
        </nav>

        {/* HERO */}
        <section id="top" style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'120px 40px 80px',position:'relative',overflow:'hidden',border:'none'}}>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(0,232,122,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,232,122,0.03) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}} />
          <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,color:'var(--green)',letterSpacing:'0.15em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:8,marginBottom:28}}>
            <span style={{width:24,height:1,background:'var(--green)',display:'inline-block'}} />
            Encrypted prediction markets on Solana
          </div>
          <h1 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(52px,8vw,96px)',color:'var(--white)',lineHeight:0.95,letterSpacing:-3,marginBottom:32,maxWidth:900}}>
            Predict.<br /><em style={{fontStyle:'normal',color:'var(--green)'}}>Stay private.</em><br />Win big.
          </h1>
          <p style={{fontSize:17,color:'var(--text)',maxWidth:560,lineHeight:1.65,marginBottom:48}}>
            The first prediction market where every position is encrypted until settlement. Nobody can see your bet — not even us. Powered by Arcium MPC + ZK proofs on Solana.
          </p>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            <button onClick={() => document.getElementById('markets')?.scrollIntoView({behavior:'smooth'})}
              style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12,padding:'13px 28px',background:'var(--green)',color:'var(--black)',border:'none',cursor:'pointer',fontWeight:500}}>
              Explore markets →
            </button>
            <button onClick={() => document.getElementById('flow')?.scrollIntoView({behavior:'smooth'})}
              style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12,padding:'12px 28px',background:'transparent',color:'var(--white)',border:'1px solid #222',cursor:'pointer'}}>
              See data flow
            </button>
          </div>
          <div style={{display:'flex',gap:48,marginTop:80,paddingTop:40,borderTop:'1px solid #222',flexWrap:'wrap'}}>
            {[['3','Market types'],['$1–$100','Accuracy tiers'],['100%','Pre-settlement private'],['ZK','Verified payouts']].map(([n,l]) => (
              <div key={l}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:36,color:'var(--white)'}}>{n}</div>
                <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:10,color:'var(--text2)',letterSpacing:'0.1em',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MARKETS */}
        <section id="markets">
          <div className="section-tag">// market types</div>
          <h2>Three ways to play</h2>
          <p className="section-sub">Each market type has different stake rules and payout math. Same privacy guarantee across all — your prediction is encrypted the moment you submit it. All bets go into a single unified pool per market — the pool address reveals nothing.</p>
          <div className="market-grid">
            <div className="market-card binary">
              <div className="market-num">01</div>
              <div style={{marginBottom:16}}>
                <span className="market-type-badge">Binary market</span>
                <span className="stake-badge stake-var">variable stake</span>
              </div>
              <h3>Yes or No</h3>
              <p className="market-question">&ldquo;Will BTC close above $100k on Friday?&rdquo;</p>
              <div className="market-detail">Encrypt: <span>&#123; side: 0 or 1 &#125;</span></div>
              <div className="market-detail">Stake: <span>any amount — bigger stake = bigger share</span></div>
              <div className="market-detail">Payout: <span>stake_net + (stake_net / winner_pool) × loser_pool</span></div>
              <div className="pool-row">
                <div className="pool-pill yes">Unified pool — side hidden</div>
              </div>
            </div>
            <div className="market-card accuracy">
              <div className="market-num">02</div>
              <div style={{marginBottom:16}}>
                <span className="market-type-badge">Accuracy market</span>
                <span className="stake-badge stake-fixed">fixed tiers</span>
              </div>
              <h3>Closest wins</h3>
              <p className="market-question">&ldquo;What will SOL price be on Jan 15?&rdquo;</p>
              <div className="market-detail">Encrypt: <span>&#123; value: predicted_number × 1000 &#125;</span></div>
              <div className="market-detail">Cutoff: <span>median error — top ~50% win (strict &lt;)</span></div>
              <div className="market-detail">Weight: <span>(SCALE/(SCALE+rel_err))^6</span></div>
              <div className="pool-row">
                <div className="pool-pill acc" style={{flex:1}}>Single pool per tier — value hidden</div>
              </div>
              <div className="tier-badges" style={{marginTop:14}}>
                <div className="tier-badge active">$1</div>
                <div className="tier-badge active">$10</div>
                <div className="tier-badge active">$100</div>
              </div>
            </div>
            <div className="market-card multi">
              <div className="market-num">03</div>
              <div style={{marginBottom:16}}>
                <span className="market-type-badge">Multi-outcome</span>
                <span className="stake-badge stake-var">variable stake</span>
              </div>
              <h3>Pick the winner</h3>
              <p className="market-question">&ldquo;Who wins Champions League 2025?&rdquo;</p>
              <div className="market-detail">Encrypt: <span>&#123; outcome_index: 0-3 &#125;</span></div>
              <div className="market-detail">Stake: <span>any amount — minority wins most</span></div>
              <div className="market-detail">Payout: <span>winning pool splits all losing pools proportionally</span></div>
              <div className="pool-row">
                <div className="pool-pill outcome">Unified pool — outcome hidden</div>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,marginTop:2}}>
            <div style={{background:'var(--gray)',padding:'20px 24px',borderLeft:'2px solid var(--green)'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--green)',letterSpacing:'.1em',marginBottom:8}}>BINARY + MULTI — VARIABLE STAKES</div>
              <div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>
                Bet $5, $50, or $500. Bigger stake on winning side = bigger share of loser pool. 2% fee on total: 1.5% creator + 0.5% protocol.
              </div>
            </div>
            <div style={{background:'var(--gray)',padding:'20px 24px',borderLeft:'2px solid var(--purple)'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--purple)',letterSpacing:'.1em',marginBottom:8}}>ACCURACY — FIXED TIERS ONLY</div>
              <div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>
                Everyone in the same tier pays the exact same fee. Stake size has zero effect — only prediction accuracy determines payout. 20% platform fee on loser pool.
              </div>
            </div>
          </div>
        </section>

        {/* TIERS */}
        <section id="tiers">
          <div className="section-tag">// accuracy tiers</div>
          <h2>Accuracy market.<br />Three isolated lobbies.</h2>
          <p className="section-sub">Accuracy markets only. Same question, separate pools. $1 bettors compete against $1 bettors. Skill wins — not wallet size.</p>
          <div className="tier-grid">
            <div className="tier-card">
              <div className="tier-amount" style={{color:'var(--green)'}}>$1</div>
              <div className="tier-name">Micro lobby</div>
              <div className="tier-sep" />
              <div className="tier-feature">Low stakes, high volume</div>
              <div className="tier-feature">Learn the platform</div>
              <div className="tier-feature">Isolated from $10/$100</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:16}}>1_000_000 USDC (6 decimals)</div>
            </div>
            <div className="tier-card" style={{border:'1px solid var(--purple)',borderTop:'none',borderBottom:'none'}}>
              <div className="tier-amount">$10</div>
              <div className="tier-name">Standard lobby</div>
              <div className="tier-sep" />
              <div className="tier-feature">Core accuracy product</div>
              <div className="tier-feature">Deepest participation</div>
              <div className="tier-feature">Most active pools</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:16}}>10_000_000 USDC (6 decimals)</div>
            </div>
            <div className="tier-card">
              <div className="tier-amount" style={{color:'var(--amber)'}}>$100</div>
              <div className="tier-name">Whale lobby</div>
              <div className="tier-sep" />
              <div className="tier-feature">High conviction</div>
              <div className="tier-feature">Bigger prize pool</div>
              <div className="tier-feature">Isolated from lower tiers</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:16}}>100_000_000 USDC (6 decimals)</div>
            </div>
          </div>
        </section>

        {/* DATA FLOW — new section */}
        <DataFlowSection />

        {/* PROTOCOL SPEC — new section */}
        <ProtocolSection />

        {/* ARCHITECTURE */}
        <section id="arch">
          <div className="section-tag">// architecture</div>
          <h2>What lives where</h2>
          <p className="section-sub">Four layers. Solana handles money and state. Arcium decrypts only what needs to be secret. Backend handles coordination and math. Your device handles encryption.</p>

          <div className="arch-diagram">
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',letterSpacing:'.1em',marginBottom:20}}>// hybrid architecture — Arcium equality checks only</div>
            <div className="arch-layer">
              <div className="arch-layer-label">user device + oracle</div>
              <div className="arch-boxes" style={{gridTemplateColumns:'1fr 1fr'}}>
                <div className="arch-box green">
                  <div className="arch-box-title">User wallet</div>
                  <div className="arch-box-sub">Encrypts prediction with MXE pubkey. Never sent as plaintext.</div>
                </div>
                <div className="arch-box amber">
                  <div className="arch-box-title">Oracle</div>
                  <div className="arch-box-sub">Pyth · Chainlink · manual. Dispute window. Multisig 3 of 5.</div>
                </div>
              </div>
            </div>
            <div className="arch-arrow">↓ encrypted tx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↓ resolved_value</div>
            <div className="arch-layer">
              <div className="arch-layer-label">solana on-chain — trustless · immutable</div>
              <div className="arch-boxes" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                <div className="arch-box green"><div className="arch-box-title">Market + Position PDA</div><div className="arch-box-sub">status · stake · encrypted payload</div></div>
                <div className="arch-box green"><div className="arch-box-title">USDC vault</div><div className="arch-box-sub">escrow · program-owned</div></div>
                <div className="arch-box green"><div className="arch-box-title">Oracle result PDA</div><div className="arch-box-sub">resolved_value · dispute window</div></div>
              </div>
              <div className="arch-boxes" style={{gridTemplateColumns:'1fr 1fr',marginTop:2}}>
                <div className="arch-box teal"><div className="arch-box-title">Settlement Registry PDA <span className="arch-new-badge">★ new</span></div><div className="arch-box-sub">total_shards · settled_shards · status: InProgress → Finalizing</div></div>
                <div className="arch-box blue"><div className="arch-box-title">Arcium mempool + Settlement IX</div><div className="arch-box-sub">queues shard jobs · verifies ZK proof · updates registry</div></div>
              </div>
            </div>
            <div className="arch-arrow">↓ queue N shard jobs parallel &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↑ winner flags (callback) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↑ write payouts</div>
            <div className="arch-boxes" style={{gridTemplateColumns:'1fr 1fr',gap:2}}>
              <div style={{background:'var(--gray2)',padding:'20px 24px',borderLeft:'2px solid var(--purple)'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--purple)',letterSpacing:'.1em',marginBottom:12}}>ARCIUM MXE</div>
                <div className="arch-box purple" style={{marginBottom:8}}><div className="arch-box-title">Equality checks only <span className="arch-changed-badge">⚡ changed</span></div><div className="arch-box-sub">was full scoring. now: is_winner = prediction == outcome?</div></div>
                <div className="arch-box purple"><div className="arch-box-title">Winner flags out</div><div className="arch-box-sub">is_winner[8] · ZK proof verified on-chain</div></div>
              </div>
              <div style={{background:'var(--gray2)',padding:'20px 24px',borderLeft:'2px solid var(--blue)'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--blue)',letterSpacing:'.1em',marginBottom:12}}>BACKEND</div>
                <div className="arch-box blue" style={{marginBottom:8}}><div className="arch-box-title">Payout math <span className="arch-new-badge">★ new</span></div><div className="arch-box-sub">public stakes + winner flags → proportional payouts</div></div>
                <div className="arch-box blue"><div className="arch-box-title">Shard coordinator <span className="arch-new-badge">★ new</span></div><div className="arch-box-sub">groups positions into shards · fires all jobs in parallel</div></div>
              </div>
            </div>
          </div>

          <div className="arch-tabs" style={{marginTop:32}}>
            {(['flow','split','pdas'] as const).map(t => (
              <button key={t} className={`arch-tab${archTab===t?' active':''}`} onClick={() => setArchTab(t)}>
                {t === 'flow' ? 'Instruction flow' : t === 'split' ? 'Frontend vs backend' : 'On-chain accounts'}
              </button>
            ))}
          </div>

          {archTab === 'flow' && (
            <div>
              <div className="flow-row">
                <div className="flow-node g"><div className="fn-who">🧑 Creator — frontend</div><div className="fn-title">create_market_group</div><div className="fn-desc">Posts $10 bond. Creates event. Then: create_flat_market or create_tier_market×3.</div></div>
                <div className="flow-node p"><div className="fn-who">👤 User — frontend</div><div className="fn-title">place_bet / place_bet_accuracy</div><div className="fn-desc">Encrypts prediction. Variable stake (Binary/Multi) or fixed fee (Accuracy). All go to unified pool.</div></div>
                <div className="flow-node a"><div className="fn-who">⏰ Anyone — permissionless</div><div className="fn-title">lock_market</div><div className="fn-desc">After lock_timestamp. Backend cron calls first.</div></div>
              </div>
              <div style={{textAlign:'center',color:'#444',padding:'4px 0'}}>↓</div>
              <div className="flow-row">
                <div className="flow-node r"><div className="fn-who">🔮 Oracle / Creator</div><div className="fn-title">post_resolution</div><div className="fn-desc">Pyth or manual. Starts 1hr dispute window.</div></div>
                <div className="flow-node teal"><div className="fn-who">🤖 Backend (after dispute)</div><div className="fn-title">init_settlement_registry</div><div className="fn-desc">total_shards = ceil(N/8). Creates registry PDA.</div><div className="fn-new">★ new</div></div>
                <div className="flow-node b"><div className="fn-who">🤖 Backend (parallel)</div><div className="fn-title">queue_settlement_* × N</div><div className="fn-desc">All shards fire simultaneously. Each = 8 encrypted positions → Arcium.</div></div>
              </div>
              <div style={{textAlign:'center',color:'#444',padding:'4px 0'}}>↓</div>
              <div className="flow-row">
                <div className="flow-node p"><div className="fn-who">🔐 Arcium — auto callback</div><div className="fn-title">settle_*_callback</div><div className="fn-desc">ZK verified. Returns winner_mask. Updates registry. When all shards done → Finalizing.</div></div>
                <div className="flow-node b"><div className="fn-who">🤖 Backend — payout math</div><div className="fn-title">write_position_payout</div><div className="fn-desc">Public stakes + winner_mask → payout per position. 1 tx each.</div><div className="fn-new">★ math in backend</div></div>
                <div className="flow-node g"><div className="fn-who">👤 User — frontend</div><div className="fn-title">claim_payout</div><div className="fn-desc">USDC vault → wallet. Works for all 3 market types.</div></div>
              </div>
            </div>
          )}

          {archTab === 'split' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
              <div style={{background:'var(--gray)',padding:32}}>
                <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase' as const,paddingBottom:16,borderBottom:'var(--border)',marginBottom:20,color:'var(--green)'}}>// frontend — user signs</div>
                {[
                  {n:'create_market_group',w:'creator wallet → pays $10 bond'},
                  {n:'create_flat_market',w:'YesNo/Multi → called once'},
                  {n:'create_tier_market ×3',w:'Accuracy → $1/$10/$100'},
                  {n:'create_pool',w:'YesNo/Multi: 1 call. Accuracy: 3 calls'},
                  {n:'place_bet',w:'Binary/Multi → variable stake'},
                  {n:'place_bet_accuracy',w:'Accuracy → exact tier fee enforced'},
                  {n:'claim_payout',w:'user receives USDC'},
                  {n:'return_bond',w:'creator after full settlement'},
                  {n:'cancel_market',w:'creator → before any bets'},
                  {n:'post_resolution',w:'manual markets → creator signs'},
                ].map(ix=>(
                  <div key={ix.n} style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid #111'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--white)'}}>{ix.n}</div>
                    <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:3}}>{ix.w}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'var(--gray)',padding:32}}>
                <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase' as const,paddingBottom:16,borderBottom:'var(--border)',marginBottom:20,color:'var(--purple)'}}>// backend — server signs</div>
                {[
                  {n:'lock_market',w:'cron after lock_timestamp'},
                  {n:'post_resolution',w:'oracle service — Pyth markets'},
                  {n:'init_settlement_registry ★',w:'after dispute window — new'},
                  {n:'queue_settlement_* ×N',w:'parallel shard jobs'},
                  {n:'settle_*_callback',w:'Arcium auto-calls — do not call directly'},
                  {n:'accuracy_send_fees',w:'accuracy platform fee → treasury'},
                  {n:'write_position_payout ★',w:'computes from public data — new'},
                  {n:'slash_bond',w:'cron if creator misses deadline'},
                ].map(ix=>(
                  <div key={ix.n} style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid #111'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--white)'}}>{ix.n.replace(' ★','')}{ix.n.includes('★')&&<span style={{fontFamily:'var(--mono)',fontSize:9,padding:'1px 5px',background:'rgba(0,232,122,.12)',color:'var(--green)',border:'1px solid var(--green)',marginLeft:6}}>★ new</span>}</div>
                    <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:3}}>{ix.w}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {archTab === 'pdas' && (
            <div style={{fontFamily:'var(--mono)',fontSize:12,lineHeight:2.2,color:'var(--text)',padding:32,background:'var(--gray)'}}>
              <div style={{color:'var(--green)',fontSize:14,fontWeight:500}}>CyperMarket PDA <span style={{color:'var(--gray3)'}}>["cyper_market"] — 1 global</span></div>
              {[
                {l:1,t:'MarketGroup PDA',c:'["market_group", config, group_index]'},
                {l:2,t:'Bond PDA + vault',c:'["bond", group] — $10 USDC'},
                {l:2,t:'Settlement Registry PDA ★',c:'["settlement_registry", pool]',new:true},
                {l:2,t:'Market PDA (YesNo/Multi)',c:'["market", group, 0] — bet_size=0'},
                {l:3,t:'Pool PDA (unified) + vault',c:'["pool", market, 0] — all bettors'},
                {l:4,t:'Position PDAs',c:'["position", pool, user] — stake + encrypted_payload'},
                {l:2,t:'Market PDAs (Accuracy) ×3',c:'["market", group, 0/1/2] — $1/$10/$100'},
                {l:3,t:'Pool PDA (per tier) + vault',c:'["pool", market, 0]'},
                {l:4,t:'Position PDAs',c:'["position", pool, user]'},
              ].map((r,i)=>(
                <div key={i} style={{paddingLeft:`${r.l*22}px`}}>
                  <span style={{color:'var(--gray3)'}}>{r.l===1?'├── ':r.l===2?'├── ':r.l===3?'├── ':'└── '}</span>
                  <span style={{color:r.new?'var(--green)':'var(--white)'}}>{r.t}</span>
                  <span style={{color:'var(--gray3)'}}> {r.c}</span>
                  {r.new&&<span style={{fontFamily:'var(--mono)',fontSize:9,padding:'1px 5px',background:'rgba(0,232,122,.12)',color:'var(--green)',border:'1px solid var(--green)',marginLeft:8}}>★ new</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ENCRYPTION */}
        <section id="encryption">
          <div className="section-tag">// privacy layer</div>
          <h2>How your bet stays private</h2>
          <p className="section-sub">Three steps. Encrypted client-side. Arcium checks if it matches outcome. Backend computes payouts from public data.</p>
          <div className="encrypt-box">
            <div className="encrypt-flow">
              <div className="ef-node">
                <div className="ef-label">01 — Your device</div>
                <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--green)',lineHeight:1.8}}>prediction: YES<br />stake: $50</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:8,fontFamily:'var(--mono)'}}>plaintext in browser only<br />never sent unencrypted</div>
              </div>
              <div className="ef-arrow">→</div>
              <div className="ef-node">
                <div className="ef-label">02 — On-chain (Position PDA)</div>
                <div className="ef-encrypted">8f4a2c9e1b7d3f5a0e6c8b4a2f9d1e3b7c5a0f2e4d8b6c3a1f9e7d5b3c1a9f...</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:8,fontFamily:'var(--mono)'}}>encrypted blob on-chain<br />stake=$50 public · prediction hidden</div>
              </div>
              <div className="ef-arrow">→</div>
              <div className="ef-node">
                <div className="ef-label">03 — Arcium MXE</div>
                <div className="ef-result">is_winner: true ✓<br />ZK proof: verified</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:8,fontFamily:'var(--mono)'}}>equality check only<br />no payout math in circuit</div>
              </div>
            </div>
            <div style={{marginTop:32,paddingTop:28,borderTop:'var(--border)',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              <div><div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:8}}>ALWAYS PRIVATE</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>Your prediction (YES/NO/number/outcome)<br />Which side you chose — before settlement<br />Your entry timing</div></div>
              <div><div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:8}}>ALWAYS PUBLIC</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>Your stake amount (BetPlaced event)<br />Pool participant count + total volume<br />Winner/loser status — after settlement only</div></div>
              <div><div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:8}}>ARCIUM GUARANTEE</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>MPC: key shards split across nodes<br />ZK proof: computation verifiable<br />Even Cypher cannot read your prediction</div></div>
            </div>
          </div>
        </section>

        {/* MATH */}
        <section id="math">
          <div className="section-tag">// payout formulas</div>
          <h2>The math</h2>
          <p className="section-sub">Binary and Multi: 2% fee on total pool. Accuracy: 20% platform fee on loser pool only. Try every formula in the <a href="/" style={{color:'var(--green)'}}>math simulator →</a></p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:2}}>
            <div style={{background:'var(--gray)',padding:32}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <span className="tag-sm tag-g">Binary</span>
                <span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--green)',border:'1px solid var(--green)',padding:'1px 5px'}}>variable stakes</span>
              </div>
              <div className="code-block g" dangerouslySetInnerHTML={{__html:`fee = total × 0.02<br>net = total − fee<br>winner_pool = Σ stake_net (winners)<br>loser_pool  = Σ stake_net (losers)<br><br><span style="color:var(--green)">// bigger stake = bigger share:</span><br>payout_i = stake_net_i<br>&nbsp;&nbsp;&nbsp;&nbsp;+ (stake_net_i / winner_pool) × loser_pool`}} />
            </div>
            <div style={{background:'var(--gray)',padding:32}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <span className="tag-sm tag-p">Accuracy</span>
                <span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--purple)',border:'1px solid var(--purple)',padding:'1px 5px'}}>fixed tiers</span>
              </div>
              <div className="code-block p" dangerouslySetInnerHTML={{__html:`error_i = |predict_i − actual|<br>sort → median = sorted[floor((N+1)/2)]<br><br><span style="color:var(--purple)">won_i = error_i &lt; median (strict)</span><br>loser_pool = losers × F<br>platform_fee = loser_pool × 0.20<br>prize = loser_pool − platform_fee<br><br>w_i = (SCALE/(SCALE+rel_err_i))^6<br>payout_i = F + (w_i / Σw) × prize`}} />
            </div>
            <div style={{background:'var(--gray)',padding:32}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <span className="tag-sm tag-a">Multi-outcome</span>
                <span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--amber)',border:'1px solid var(--amber)',padding:'1px 5px'}}>variable stakes</span>
              </div>
              <div className="code-block a" dangerouslySetInnerHTML={{__html:`2 to 4 outcomes — same formula as Binary<br><br><span style="color:var(--amber)">// winning pool takes all losers:</span><br>loser_pool = Σ all non-winning stakes (net)<br><br>payout_i = stake_net_i<br>&nbsp;&nbsp;&nbsp;&nbsp;+ (stake_net_i / winner_pool) × loser_pool<br><br><span style="color:var(--text2)">// minority wins more</span>`}} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="section-tag">// faq</div>
          <h2>Common questions</h2>
          <div style={{maxWidth:840}}>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => toggleFaq(i)}>
                  <span>{faq.q}</span>
                  <span className="faq-icon" style={{transform: openFaq===i ? 'rotate(45deg)' : 'none'}}>+</span>
                </div>
                <div className="faq-a" style={{maxHeight: openFaq===i ? 300 : 0}}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{padding:'56px 40px 36px',borderTop:'1px solid #222',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:40}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:28,color:'var(--white)',marginBottom:12}}>CYPHER<span style={{color:'var(--green)'}}>.</span></div>
            <div style={{fontSize:13,color:'var(--text2)',maxWidth:280,lineHeight:1.6}}>Private prediction markets on Solana. Your bets stay yours until settlement.</div>
          </div>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:16}}>// product</div>
            {[['#markets','Binary markets (variable stake)'],['#markets','Accuracy markets (tiered)'],['#markets','Multi-outcome markets'],['#tiers','Accuracy tier lobbies']].map(([href,label]) => (
              <a key={label} href={href} style={{display:'block',fontSize:13,color:'var(--text2)',marginBottom:10}}>{label}</a>
            ))}
          </div>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:16}}>// technical</div>
            {[['#flow','Data flow'],['#protocol','Protocol spec'],['#arch','Architecture'],['#encryption','Arcium encryption'],['#math','Payout formulas'],['/', 'Math simulator →']].map(([href,label]) => (
              <a key={label} href={href} style={{display:'block',fontSize:13,color:'var(--text2)',marginBottom:10}}>{label}</a>
            ))}
            <div style={{marginTop:16,fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)'}}>
              <div>bun install</div>
              <div>bun run dev</div>
            </div>
          </div>
          <div style={{gridColumn:'1/-1',paddingTop:28,borderTop:'1px solid #222',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text2)'}}>© 2025 Cypher Protocol. Built on Solana.</div>
            <div style={{display:'flex',gap:10}}>
              {['Solana','Arcium MPC','Pyth Oracle','USDC'].map(b => (
                <div key={b} style={{fontFamily:'var(--mono)',fontSize:10,padding:'4px 10px',background:'var(--gray)',color:'var(--text2)',border:'1px solid #222'}}>{b}</div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
