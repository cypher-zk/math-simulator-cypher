'use client'
import React, { useState } from 'react'

export default function SitePage() {
  const [archTab, setArchTab] = useState<'flow' | 'split' | 'pdas'>('flow')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i)

  const faqs = [
    {
      q: "Why can't anyone see other people's bets?",
      a: "Every prediction is encrypted with the Arcium MXE public key client-side in your browser before it's submitted. The encrypted blob is stored on-chain. Nobody — not other users, not validators, not Cyper — can decrypt it without the MXE's private key shards, which are split across multiple MPC nodes and only combined inside the secure computation at settlement."
    },
    {
      q: "What stops a creator from posting a wrong resolution?",
      a: "Three things: a $10 USDC bond (slashed if they misbehave), a 1-hour dispute window after any resolution, and Pyth on-chain price feeds for crypto markets which require no human input at all. For custom markets, the bond + dispute window is the protection layer."
    },
    {
      q: "How many outcomes can a multi-outcome market have?",
      a: "Between 2 and 4 outcomes in v1. Each outcome creates its own pool PDA for each tier — a 4-outcome market creates 12 pool PDAs. Solana has an account limit per transaction, so we cap at 4 for v1 to keep market creation in one transaction. More outcomes will come in v2."
    },
    {
      q: "Can I bet in multiple tiers on the same market?",
      a: "Yes. The one-bet-per-pool rule is enforced by PDA uniqueness — seeds include your wallet and pool address. You can bet in the $1 pool and $10 pool simultaneously. You cannot place two bets in the same pool."
    },
    {
      q: "What token is used?",
      a: "USDC only, across all market types. Stable value means your $10 bet is worth $10 at settlement. If you only have SOL, swap on Jupiter first — one click, 5 seconds."
    },
    {
      q: "Is the contract upgradeable?",
      a: "Yes, with a multisig upgrade authority. No single key can upgrade the program. We'll add a 48-hour timelock announcement window as we grow. All accounts have reserved padding bytes so upgrades don't require migrating existing market data."
    },
    {
      q: "What happens if nobody bets on the winning side?",
      a: "Edge case handled in the settlement contract — if winner_count is 0, the entire net pool goes to protocol treasury to prevent permanent fund lock. For accuracy markets this cannot happen — the top ~50% always win by definition of the median cutoff."
    },
  ]

  const S: React.CSSProperties = { all: 'initial' } // reset guard — not used but typed

  return (
    <>
      <style>{`
        .cy *,
        .cy *::before,
        .cy *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .cy {
          --black:#0a0a0a;--white:#f5f2eb;--green:#00e87a;--green-dim:#00e87a22;
          --purple:#7b5cfa;--purple-dim:#7b5cfa22;--amber:#f5a623;--amber-dim:#f5a62322;
          --red:#ff4444;--gray:#141414;--gray2:#1e1e1e;--gray3:#2a2a2a;
          --text:#b8b4ac;--text2:#6a6860;
          --mono:'IBM Plex Mono',monospace;--sans:'Instrument Sans',sans-serif;--display:'Syne',sans-serif;
          --border:1px solid #222;
          background:var(--black);color:var(--text);font-family:var(--sans);font-size:15px;
          line-height:1.6;overflow-x:hidden;
        }
        .cy a { text-decoration:none; }
        .cy section { padding:100px 40px; border-top:var(--border); }
        .cy h2 { font-family:var(--display);font-weight:700;font-size:clamp(32px,5vw,54px);color:var(--white);line-height:1.05;letter-spacing:-1.5px;margin-bottom:20px; }
        .cy h3 { font-family:var(--display);font-weight:600;font-size:21px;color:var(--white);letter-spacing:-.4px;margin-bottom:10px; }
        .cy .section-tag { font-family:var(--mono);font-size:11px;color:var(--green);letter-spacing:.15em;text-transform:uppercase;margin-bottom:16px; }
        .cy .section-sub { font-size:16px;color:var(--text);max-width:580px;line-height:1.65;margin-bottom:56px; }
        .cy .market-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:2px; }
        .cy .market-card { background:var(--gray);padding:36px 32px;position:relative;overflow:hidden;transition:background .25s; }
        .cy .market-card:hover { background:var(--gray2); }
        .cy .market-card::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent,var(--green)); }
        .cy .binary { --accent:var(--green); }
        .cy .accuracy { --accent:var(--purple); }
        .cy .multi { --accent:var(--amber); }
        .cy .market-num { font-family:var(--mono);font-size:56px;font-weight:300;color:var(--gray3);line-height:1;margin-bottom:24px; }
        .cy .market-type-badge { display:inline-block;font-family:var(--mono);font-size:10px;padding:4px 10px;margin-bottom:16px;letter-spacing:.1em;text-transform:uppercase; }
        .cy .binary .market-type-badge { background:var(--green-dim);color:var(--green);border:1px solid var(--green); }
        .cy .accuracy .market-type-badge { background:var(--purple-dim);color:var(--purple);border:1px solid var(--purple); }
        .cy .multi .market-type-badge { background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber); }
        .cy .market-question { font-size:15px;color:var(--text);margin-bottom:24px;line-height:1.5; }
        .cy .market-detail { font-family:var(--mono);font-size:11px;color:var(--text2);margin-bottom:6px; }
        .cy .market-detail span { color:var(--white); }
        .cy .pool-row { display:flex;gap:6px;margin-top:24px;padding-top:24px;border-top:var(--border); }
        .cy .pool-pill { flex:1;text-align:center;padding:8px 6px;background:var(--gray2);font-family:var(--mono);font-size:10px; }
        .cy .pool-pill.yes { color:var(--green); }
        .cy .pool-pill.no { color:var(--red); }
        .cy .pool-pill.outcome { color:var(--amber); }
        .cy .pool-pill.acc { color:var(--purple); }
        .cy .tier-badges { display:flex;gap:6px;margin-top:14px; }
        .cy .tier-badge { font-family:var(--mono);font-size:10px;padding:3px 8px;background:var(--gray2);color:var(--text2); }
        .cy .tier-badge.active { color:var(--white);background:var(--gray3); }
        .cy .tier-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:2px; }
        .cy .tier-card { background:var(--gray);padding:40px 32px;text-align:center; }
        .cy .tier-amount { font-family:var(--display);font-weight:800;font-size:56px;color:var(--white);letter-spacing:-2px;line-height:1;margin-bottom:8px; }
        .cy .tier-name { font-family:var(--mono);font-size:11px;color:var(--text2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:28px; }
        .cy .tier-feature { font-size:13px;color:var(--text);margin-bottom:8px; }
        .cy .tier-sep { height:1px;background:var(--gray3);margin:20px 0; }
        .cy .state-machine { display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:40px; }
        .cy .sm-state { padding:9px 18px;background:var(--gray);font-family:var(--mono);font-size:12px;color:var(--white);border:1px solid var(--gray3); }
        .cy .sm-state.s-open { border-color:var(--green);color:var(--green); }
        .cy .sm-state.s-locked { border-color:var(--amber);color:var(--amber); }
        .cy .sm-state.s-resolving { border-color:var(--purple);color:var(--purple); }
        .cy .sm-state.s-settling { border-color:#00bfff;color:#00bfff; }
        .cy .sm-state.s-settled { border-color:var(--green);background:var(--green-dim);color:var(--green); }
        .cy .sm-state.s-voided { border-color:var(--red);color:var(--red); }
        .cy .sm-arrow { font-size:16px;color:var(--text2); }
        .cy .timeline { position:relative;padding-left:40px; }
        .cy .timeline::before { content:'';position:absolute;left:8px;top:0;bottom:0;width:1px;background:var(--gray3); }
        .cy .tl-item { position:relative;margin-bottom:48px; }
        .cy .tl-dot { position:absolute;left:-39px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--black);border:2px solid var(--green); }
        .cy .tl-label { font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px; }
        .cy .tl-title { font-family:var(--display);font-weight:600;font-size:20px;color:var(--white);margin-bottom:8px;letter-spacing:-.3px; }
        .cy .tl-desc { font-size:14px;color:var(--text);line-height:1.65;max-width:640px; }
        .cy .tl-code { font-family:var(--mono);font-size:11px;color:var(--text2);background:var(--gray);padding:10px 16px;margin-top:12px;border-left:2px solid var(--green);line-height:1.8;display:inline-block;max-width:100%;word-break:break-word; }
        .cy .arch-tabs { display:flex;gap:0;border-bottom:var(--border);margin-bottom:48px; }
        .cy .arch-tab { font-family:var(--mono);font-size:11px;padding:12px 22px;background:transparent;color:var(--text2);border:none;border-bottom:2px solid transparent;cursor:pointer;letter-spacing:.05em;transition:all .2s; }
        .cy .arch-tab.active { color:var(--green);border-bottom-color:var(--green); }
        .cy .flow-row { display:flex;gap:0;align-items:stretch;margin-bottom:2px; }
        .cy .flow-node { flex:1;padding:20px 22px;background:var(--gray);border:1px solid transparent;transition:all .25s; }
        .cy .flow-node:hover { background:var(--gray2);border-color:var(--gray3); }
        .cy .flow-node.g { border-top:2px solid var(--green); }
        .cy .flow-node.p { border-top:2px solid var(--purple); }
        .cy .flow-node.a { border-top:2px solid var(--amber); }
        .cy .flow-node.r { border-top:2px solid var(--red); }
        .cy .flow-node.b { border-top:2px solid #00bfff; }
        .cy .fn-who { font-family:var(--mono);font-size:10px;color:var(--text2);margin-bottom:7px; }
        .cy .fn-title { font-family:var(--display);font-weight:600;font-size:15px;color:var(--white);margin-bottom:5px; }
        .cy .fn-desc { font-size:12px;color:var(--text);line-height:1.5; }
        .cy .fn-event { font-family:var(--mono);font-size:10px;margin-top:8px;color:var(--green); }
        .cy .fn-ix { font-family:var(--mono);font-size:10px;margin-top:5px;padding:3px 7px;display:inline-block;background:var(--gray2);color:var(--text2); }
        .cy .flow-arrow-row { display:flex;justify-content:center;align-items:center;height:28px;color:var(--text2);font-size:16px; }
        .cy .ix-split { display:grid;grid-template-columns:1fr 1fr;gap:2px; }
        .cy .ix-half { background:var(--gray);padding:32px; }
        .cy .ix-half-title { font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding-bottom:16px;border-bottom:var(--border);margin-bottom:20px; }
        .cy .ix-half.fe .ix-half-title { color:var(--green); }
        .cy .ix-half.be .ix-half-title { color:var(--purple); }
        .cy .ix-item { margin-bottom:18px;padding-bottom:18px;border-bottom:var(--border); }
        .cy .ix-item:last-child { border-bottom:none;margin-bottom:0;padding-bottom:0; }
        .cy .ix-name { font-family:var(--mono);font-size:13px;color:var(--white);margin-bottom:3px; }
        .cy .ix-who-sm { font-family:var(--mono);font-size:10px;color:var(--text2);margin-bottom:5px; }
        .cy .ix-desc-sm { font-size:12px;color:var(--text);line-height:1.55; }
        .cy .pda-tree { font-family:var(--mono);font-size:12px;line-height:2.2;color:var(--text);padding:32px;background:var(--gray); }
        .cy .pda-root { color:var(--green);font-size:14px;font-weight:500; }
        .cy .pda-l1 { color:var(--white);padding-left:22px; }
        .cy .pda-l1::before { content:'├── ';color:var(--gray3); }
        .cy .pda-l2 { padding-left:44px; }
        .cy .pda-l2::before { content:'├── ';color:var(--gray3); }
        .cy .pda-l3 { padding-left:66px;color:var(--text2); }
        .cy .pda-l3::before { content:'└── ';color:var(--gray3); }
        .cy .pda-comment { color:var(--gray3); }
        .cy .encrypt-box { background:var(--gray);padding:40px;border:var(--border); }
        .cy .encrypt-flow { display:grid;grid-template-columns:1fr 40px 1fr 40px 1fr;gap:0;align-items:center; }
        .cy .ef-node { padding:22px 18px;background:var(--gray2);text-align:center; }
        .cy .ef-arrow { text-align:center;font-family:var(--mono);font-size:18px;color:var(--gray3); }
        .cy .ef-label { font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.08em;margin-bottom:8px; }
        .cy .ef-value { font-family:var(--mono);font-size:12px;color:var(--white);line-height:1.8; }
        .cy .ef-encrypted { font-family:var(--mono);font-size:10px;color:var(--purple);word-break:break-all;line-height:1.5; }
        .cy .ef-result { font-family:var(--mono);font-size:12px;color:var(--green);line-height:1.8; }
        .cy .faq-item { border-bottom:var(--border); }
        .cy .faq-q { display:flex;justify-content:space-between;align-items:center;padding:22px 0;cursor:pointer;transition:color .2s;font-size:15px;color:var(--white);font-weight:500;gap:16px; }
        .cy .faq-q:hover { color:var(--green); }
        .cy .faq-icon { font-family:var(--mono);font-size:20px;color:var(--text2);transition:transform .25s;flex-shrink:0; }
        .cy .faq-a { overflow:hidden;transition:max-height .3s ease; }
        .cy .faq-a p { font-size:14px;color:var(--text);line-height:1.7;padding-bottom:22px;max-width:720px; }
        .cy .code-block { font-family:var(--mono);font-size:11px;color:var(--text);background:var(--gray);padding:14px 18px;border-left:2px solid;line-height:2;margin-top:12px;display:block; }
        .cy .code-block.g { border-color:var(--green); }
        .cy .code-block.p { border-color:var(--purple); }
        .cy .code-block.a { border-color:var(--amber); }
        .cy .tag-sm { display:inline-block;font-family:var(--mono);font-size:10px;padding:2px 8px;letter-spacing:.06em; }
        .cy .tag-g { background:var(--green-dim);color:var(--green);border:1px solid var(--green); }
        .cy .tag-p { background:var(--purple-dim);color:var(--purple);border:1px solid var(--purple); }
        .cy .tag-a { background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber); }
        @media(max-width:880px){
          .cy .market-grid,.cy .tier-grid,.cy .ix-split,.cy .encrypt-flow,.cy .flow-row { grid-template-columns:1fr; }
          .cy .ef-arrow { display:none; }
          .cy section { padding:70px 20px; }
        }
      `}</style>

      <div className="cy">

        {/* NAV */}
        <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 40px',height:60,background:'rgba(10,10,10,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #222'}}>
          <a href="/site" style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#f5f2eb',letterSpacing:-0.5,textDecoration:'none'}}>
            CYPER<span style={{color:'#00e87a'}}>.</span>
          </a>
          <div style={{display:'flex',gap:28}}>
            {[['#markets','Markets'],['#how','How it works'],['#arch','Architecture'],['#encryption','Encryption'],['#math','Math'],['#ownership','Ownership'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,color:'#6a6860',textDecoration:'none',letterSpacing:'0.06em'}}>{label}</a>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <a href="/" style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,padding:'8px 14px',border:'1px solid #222',color:'#b8b4ac',textDecoration:'none'}}>Math Sim</a>
            <button style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,padding:'8px 18px',background:'#00e87a',color:'#0a0a0a',border:'none',cursor:'pointer',fontWeight:500,letterSpacing:'0.05em'}}>
              Launch App ↗
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero" id="top" style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'120px 40px 80px',position:'relative',overflow:'hidden',border:'none'}}>
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
              style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12,padding:'13px 28px',background:'var(--green)',color:'var(--black)',border:'none',cursor:'pointer',fontWeight:500,letterSpacing:'0.06em'}}>
              Explore markets →
            </button>
            <button onClick={() => document.getElementById('arch')?.scrollIntoView({behavior:'smooth'})}
              style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12,padding:'12px 28px',background:'transparent',color:'var(--white)',border:'1px solid #222',cursor:'pointer',letterSpacing:'0.06em'}}>
              See architecture
            </button>
          </div>
          <div style={{display:'flex',gap:48,marginTop:80,paddingTop:40,borderTop:'1px solid #222',flexWrap:'wrap'}}>
            {[['3','Market types'],['$1–$100','Tiered lobbies'],['100%','Positions private'],['ZK','Verified payouts']].map(([n,l]) => (
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
          <p className="section-sub">Each market type has different math. Same privacy guarantee across all — your prediction is encrypted the moment you submit it.</p>
          <div className="market-grid">
            <div className="market-card binary">
              <div className="market-num">01</div>
              <div className="market-type-badge">Binary market</div>
              <h3>Yes or No</h3>
              <p className="market-question">&ldquo;Will BTC close above $100k on Friday?&rdquo;</p>
              <div className="market-detail">Pick: <span>YES or NO</span></div>
              <div className="market-detail">Winners: <span>correct side splits loser pool equally</span></div>
              <div className="market-detail">Formula: <span>stake_net + (stake / YES_net) × NO_net</span></div>
              <div className="pool-row">
                <div className="pool-pill yes">YES pool</div>
                <div className="pool-pill no">NO pool</div>
              </div>
              <div className="tier-badges">
                <div className="tier-badge active">$1</div>
                <div className="tier-badge active">$10</div>
                <div className="tier-badge active">$100</div>
              </div>
            </div>
            <div className="market-card accuracy">
              <div className="market-num">02</div>
              <div className="market-type-badge">Accuracy market</div>
              <h3>Closest wins</h3>
              <p className="market-question">&ldquo;What will SOL price be on Jan 15?&rdquo;</p>
              <div className="market-detail">Pick: <span>your exact numeric prediction</span></div>
              <div className="market-detail">Cutoff: <span>median error — top ~50% win</span></div>
              <div className="market-detail">Weight: <span>(1/(1+r))^6 — closer = bigger share</span></div>
              <div className="pool-row">
                <div className="pool-pill acc" style={{flex:1}}>Single prediction pool — all vs all</div>
              </div>
              <div className="tier-badges">
                <div className="tier-badge active">$1</div>
                <div className="tier-badge active">$10</div>
                <div className="tier-badge active">$100</div>
              </div>
            </div>
            <div className="market-card multi">
              <div className="market-num">03</div>
              <div className="market-type-badge">Multi-outcome</div>
              <h3>Pick the winner</h3>
              <p className="market-question">&ldquo;Who wins Champions League 2025?&rdquo;</p>
              <div className="market-detail">Options: <span>2 to 4 outcomes (v1 max: 4)</span></div>
              <div className="market-detail">Winners: <span>winning pool splits all losing pools</span></div>
              <div className="market-detail">Formula: <span>stake_net + net_losers / winner_count</span></div>
              <div className="pool-row">
                <div className="pool-pill outcome">Real Madrid</div>
                <div className="pool-pill outcome">Arsenal</div>
                <div className="pool-pill outcome">Bayern</div>
                <div className="pool-pill outcome">PSG</div>
              </div>
              <div className="tier-badges">
                <div className="tier-badge active">$1</div>
                <div className="tier-badge active">$10</div>
                <div className="tier-badge active">$100</div>
              </div>
            </div>
          </div>
        </section>

        {/* TIERS */}
        <section id="tiers">
          <div className="section-tag">// tiered lobbies</div>
          <h2>Every market. Three isolated pools.</h2>
          <p className="section-sub">Same question. Separate money. $1 bettors only compete against $1 bettors. Whales can&apos;t affect your tier.</p>
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
            <div className="tier-card" style={{border:'1px solid var(--green)',borderTop:'none',borderBottom:'none'}}>
              <div className="tier-amount">$10</div>
              <div className="tier-name">Standard lobby</div>
              <div className="tier-sep" />
              <div className="tier-feature">Core product</div>
              <div className="tier-feature">Deepest liquidity</div>
              <div className="tier-feature">Most active markets</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:16}}>10_000_000 USDC (6 decimals)</div>
            </div>
            <div className="tier-card">
              <div className="tier-amount" style={{color:'var(--amber)'}}>$100</div>
              <div className="tier-name">Whale lobby</div>
              <div className="tier-sep" />
              <div className="tier-feature">High conviction plays</div>
              <div className="tier-feature">Bigger pot, bigger win</div>
              <div className="tier-feature">Isolated from lower tiers</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:16}}>100_000_000 USDC (6 decimals)</div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how">
          <div className="section-tag">// lifecycle</div>
          <h2>From bet to payout</h2>
          <p className="section-sub">Seven stages. Your prediction stays encrypted from placement to settlement.</p>
          <div className="state-machine">
            <div className="sm-state s-open">OPEN</div><div className="sm-arrow">→</div>
            <div className="sm-state s-locked">LOCKED</div><div className="sm-arrow">→</div>
            <div className="sm-state s-resolving">RESOLVING</div><div className="sm-arrow">→</div>
            <div className="sm-state s-settling">SETTLING</div><div className="sm-arrow">→</div>
            <div className="sm-state s-settled">SETTLED</div>
            <div className="sm-arrow" style={{color:'var(--red)'}}>⤷</div>
            <div className="sm-state s-voided">VOIDED</div>
          </div>
          <div className="timeline">
            {[
              {dot:'var(--green)',label:'Stage 01 — Creation',title:'Creator opens the market',desc:"Anyone can create a market. Post a $10 USDC bond, choose type (Binary/Accuracy/Multi 2–4 options), set the question, oracle source, lock time, and resolve deadline. Three tier pools go live immediately.",code:'create_market_group() + create_tier_market() ×3 → emits GroupCreated',codeColor:'var(--green)'},
              {dot:'var(--purple)',label:'Stage 02 — Betting (OPEN)',title:'Users place encrypted bets',desc:"User picks a market, tier, and prediction. The browser encrypts the prediction with the Arcium MXE public key before it leaves the device. The ciphertext goes on-chain. Nobody can read it — not validators, not other users, not Cyper.",code:'encrypt(prediction, mxe_pubkey) → place_bet(encrypted_payload) → emits BetPlaced',codeColor:'var(--purple)'},
              {dot:'var(--amber)',label:'Stage 03 — Lock',title:'Betting closes',desc:"After lock_timestamp, no new bets. Permissionless — your backend calls it, but any user can too as fallback.",code:'lock_market() → permissionless, anyone can call → emits GroupLocked',codeColor:'var(--amber)'},
              {dot:'var(--red)',label:'Stage 04 — Resolution',title:'Oracle posts the answer',desc:"Pyth feed (trustless) or creator manual post. 1-hour dispute window starts. Creator's $10 bond is at risk if wrong.",code:'post_resolution(resolved_value) → 1hr dispute window → emits ResolutionPosted',codeColor:'var(--red)'},
              {dot:'#00bfff',label:'Stage 05 — Settlement (Arcium)',title:'Encrypted compute scores everyone',desc:"Arcium MXE nodes pick up all encrypted payloads and run scoring privately. No node sees individual predictions. Output: ZK proof + payout table.",code:'queue_settlement() → [Arcium decrypts + scores + ZK] → settle_callback() → write_position_payouts()',codeColor:'#00bfff'},
              {dot:'var(--green)',label:'Stage 06 — Payout',title:'Winners claim USDC',desc:"Position is SETTLED. User calls claim_payout — USDC moves from pool vault to their wallet. Creator earns 1.5% LP fee. Protocol takes 0.5%.",code:'claim_payout() → pool vault → user wallet → emits PayoutClaimed',codeColor:'var(--green)'},
              {dot:'var(--green)',label:'Stage 07 — Cleanup',title:'Creator gets bond back',desc:"After all pools settle, creator calls return_bond. If they never resolved, anyone can slash the bond — it goes to treasury.",code:'return_bond() → $10 USDC back to creator — OR — slash_bond() → treasury + GroupVoided',codeColor:'var(--green)'},
            ].map((item, i) => (
              <div key={i} className="tl-item">
                <div className="tl-dot" style={{borderColor:item.dot}} />
                <div className="tl-label">{item.label}</div>
                <div className="tl-title">{item.title}</div>
                <div className="tl-desc">{item.desc}</div>
                <div className="tl-code" style={{borderLeftColor:item.codeColor}}>{item.code}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section id="arch">
          <div className="section-tag">// architecture</div>
          <h2>What lives where</h2>
          <p className="section-sub">Three layers. Solana handles money and state. Arcium handles encrypted computation. Your backend handles speed and indexing.</p>
          <div className="arch-tabs">
            {(['flow','split','pdas'] as const).map(t => (
              <button key={t} className={`arch-tab${archTab===t?' active':''}`} onClick={() => setArchTab(t)}>
                {t === 'flow' ? 'Instruction flow' : t === 'split' ? 'Frontend vs backend' : 'On-chain accounts'}
              </button>
            ))}
          </div>

          {archTab === 'flow' && (
            <div>
              <div className="flow-row">
                <div className="flow-node g"><div className="fn-who">🧑 Creator — frontend</div><div className="fn-title">create_market_group</div><div className="fn-desc">Posts $10 bond. Writes MarketGroup PDA. One per event.</div><div className="fn-event">→ GroupCreated</div><div className="fn-ix">+ create_tier_market ×3</div></div>
                <div className="flow-node p"><div className="fn-who">👤 User — frontend</div><div className="fn-title">place_bet</div><div className="fn-desc">Encrypts prediction locally. Transfers USDC. Creates Position PDA.</div><div className="fn-event">→ BetPlaced (no prediction info)</div></div>
                <div className="flow-node a"><div className="fn-who">⏰ Anyone — permissionless</div><div className="fn-title">lock_market</div><div className="fn-desc">Closes betting. Freezes accuracy sigma. Backend or any user.</div><div className="fn-event">→ GroupLocked</div></div>
              </div>
              <div className="flow-arrow-row">↓</div>
              <div className="flow-row">
                <div className="flow-node r"><div className="fn-who">🔮 Oracle / Creator</div><div className="fn-title">post_resolution</div><div className="fn-desc">Pyth feed or creator posts real answer. 1hr dispute window.</div><div className="fn-event">→ ResolutionPosted</div></div>
                <div className="flow-node b"><div className="fn-who">🤖 Backend (after dispute)</div><div className="fn-title">queue_settlement</div><div className="fn-desc">All encrypted payloads → Arcium mempool. One per pool.</div><div className="fn-event">→ SettlementQueued</div></div>
                <div className="flow-node p"><div className="fn-who">🔐 Arcium MXE — automatic</div><div className="fn-title">settle_callback</div><div className="fn-desc">ZK proof verified. Fees sent. Pool → SETTLED.</div><div className="fn-event">→ PoolSettled</div></div>
              </div>
              <div className="flow-arrow-row">↓</div>
              <div className="flow-row">
                <div className="flow-node g"><div className="fn-who">🤖 Backend (batched)</div><div className="fn-title">write_position_payouts</div><div className="fn-desc">Writes payout amounts to Position PDAs. 20 per tx. Idempotent.</div><div className="fn-event">→ (no event)</div></div>
                <div className="flow-node g"><div className="fn-who">👤 User — frontend</div><div className="fn-title">claim_payout</div><div className="fn-desc">USDC from vault to user wallet. Only if payout &gt; 0.</div><div className="fn-event">→ PayoutClaimed</div></div>
                <div className="flow-node r"><div className="fn-who">😈 Anyone if creator fails</div><div className="fn-title">slash_bond</div><div className="fn-desc">Missed deadline. Bond → treasury. Market voided.</div><div className="fn-event">→ BondSlashed + GroupVoided</div></div>
              </div>
            </div>
          )}

          {archTab === 'split' && (
            <div className="ix-split">
              <div className="ix-half fe">
                <div className="ix-half-title">// frontend — user signs</div>
                {[
                  {name:'create_market_group',who:'creator wallet → pays $10 USDC bond',desc:"User creates the event. Bond deducted atomically. Must be signed — it's their money."},
                  {name:'create_tier_market ×3',who:'creator → called 3 times',desc:'Creates $1, $10, $100 tier markets. 3 separate transactions, can be batched in UX.'},
                  {name:'place_bet',who:'user wallet → pays USDC bet amount',desc:'Browser encrypts prediction first. User signs. USDC deducted. Position PDA created with encrypted blob.'},
                  {name:'claim_payout',who:'user wallet → receives USDC',desc:"User pulls winnings. Requires signature — program can't push to arbitrary wallets."},
                  {name:'return_bond',who:'creator wallet',desc:'Creator reclaims bond after settlement. Signature proves identity.'},
                  {name:'cancel_market',who:'creator only — before any bets',desc:'Creator cancels. Only works with zero bets placed across all tiers.'},
                ].map(ix => (
                  <div key={ix.name} className="ix-item">
                    <div className="ix-name">{ix.name}</div>
                    <div className="ix-who-sm">{ix.who}</div>
                    <div className="ix-desc-sm">{ix.desc}</div>
                  </div>
                ))}
              </div>
              <div className="ix-half be">
                <div className="ix-half-title">// backend — your server signs</div>
                {[
                  {name:'lock_market',who:'cron job after lock_timestamp',desc:"Permissionless — any signer works. Backend calls first. Any user can call as fallback."},
                  {name:'post_resolution',who:'oracle service — reads Pyth, signs with oracle keypair',desc:'For Pyth markets: oracle service reads feed and calls this. For creator markets: creator calls from frontend.'},
                  {name:'queue_settlement_yesno/multi/accuracy',who:'backend — after 1hr dispute window',desc:'Collects all encrypted Position payloads, sends to Arcium. Backend pays gas.'},
                  {name:'settle_*_callback',who:'Arcium MXE — fully automatic',desc:"You don't call this. Arcium calls it after computation. Your program just needs the callback registered."},
                  {name:'write_position_payouts',who:'backend — after callback, batches of 20',desc:'Writes payout amounts to Position PDAs. Idempotent — safe to retry if tx fails.'},
                  {name:'slash_bond',who:'backend monitors + any user',desc:'Permissionless. Backend triggers when deadline passes. Users protected even if backend fails.'},
                ].map(ix => (
                  <div key={ix.name} className="ix-item">
                    <div className="ix-name">{ix.name}</div>
                    <div className="ix-who-sm">{ix.who}</div>
                    <div className="ix-desc-sm">{ix.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {archTab === 'pdas' && (
            <div>
              <div className="pda-tree">
                <div className="pda-root">CyperMarket PDA <span className="pda-comment">[&quot;cyper_market&quot;] — 1 global, admin config</span></div>
                <div className="pda-l1">MarketGroup PDA <span className="pda-comment">[&quot;market_group&quot;, config, group_index] — 1 per event</span></div>
                <div className="pda-l2">Bond PDA + vault <span className="pda-comment">[&quot;bond&quot;, group] — $10 USDC security deposit</span></div>
                <div className="pda-l2">Market PDA [Micro $1] <span className="pda-comment">[&quot;market&quot;, group, 0]</span></div>
                <div className="pda-l3">Pool PDA [YES $1] + vault &nbsp;<span className="pda-comment">[&quot;pool&quot;, market, 0]</span></div>
                <div className="pda-l3">Pool PDA [NO $1] + vault &nbsp;<span className="pda-comment">[&quot;pool&quot;, market, 1]</span></div>
                <div className="pda-l3">Position PDAs <span className="pda-comment">[&quot;position&quot;, pool, user_wallet] — 1 per user per pool</span></div>
                <div className="pda-l2">Market PDA [Standard $10] <span className="pda-comment">[&quot;market&quot;, group, 1]</span></div>
                <div className="pda-l3">Pool PDA [YES $10] + Pool PDA [NO $10] + Position PDAs</div>
                <div className="pda-l2">Market PDA [Whale $100] <span className="pda-comment">[&quot;market&quot;, group, 2]</span></div>
                <div className="pda-l3">Pool PDA [YES $100] + Pool PDA [NO $100] + Position PDAs</div>
                <br />
                <div className="pda-root" style={{color:'var(--purple)'}}>Multi-outcome variant <span className="pda-comment" style={{color:'var(--text2)'}}>2–4 outcomes per tier</span></div>
                <div className="pda-l2" style={{color:'var(--purple)'}}>Pool PDA [Outcome 0] + [Outcome 1] + [Outcome 2] + [Outcome 3?]</div>
                <br />
                <div className="pda-root" style={{color:'var(--amber)'}}>Accuracy variant <span className="pda-comment" style={{color:'var(--text2)'}}>single pool per tier, all vs all</span></div>
                <div className="pda-l2" style={{color:'var(--amber)'}}>Pool PDA [predictions] — one pool, everyone competes</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2,marginTop:2}}>
                {[
                  {color:'var(--green)',label:'BINARY',pools:'3 tiers × 2 pools = 6 pool PDAs',note:'+ 6 vaults + 1 bond + 1 group = 17 total'},
                  {color:'var(--purple)',label:'ACCURACY',pools:'3 tiers × 1 pool = 3 pool PDAs',note:'+ 3 vaults + 1 bond + 1 group = 11 total'},
                  {color:'var(--amber)',label:'MULTI (4 outcomes)',pools:'3 tiers × 4 pools = 12 pool PDAs',note:'+ 12 vaults + 1 bond + 1 group = 29 total'},
                ].map(row => (
                  <div key={row.label} style={{background:'var(--gray)',padding:'18px 22px'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:10,color:row.color,marginBottom:6,letterSpacing:'0.1em'}}>{row.label}</div>
                    <div style={{fontSize:13,color:'var(--text)'}}>{row.pools.split(' = ')[0]} = <strong style={{color:'var(--white)'}}>{row.pools.split(' = ')[1]}</strong></div>
                    <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginTop:4}}>{row.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ENCRYPTION */}
        <section id="encryption">
          <div className="section-tag">// privacy layer</div>
          <h2>How your bet stays private</h2>
          <p className="section-sub">Three steps. Everything sensitive is encrypted client-side before touching the chain.</p>
          <div className="encrypt-box">
            <div className="encrypt-flow">
              <div className="ef-node">
                <div className="ef-label">01 — Your device</div>
                <div className="ef-value" style={{color:'var(--green)'}}>prediction: YES<br />tier: $10 pool</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:8,fontFamily:'var(--mono)'}}>plaintext in browser only<br />never sent unencrypted</div>
              </div>
              <div className="ef-arrow">→</div>
              <div className="ef-node">
                <div className="ef-label">02 — On-chain (Position PDA)</div>
                <div className="ef-encrypted">8f4a2c9e1b7d3f5a0e6c8b4a2f9d1e3b7c5a0f2e4d8b6c3a1f9e7d5b3c1a9f7e2d4b6a8c0e2f4b6a...</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:8,fontFamily:'var(--mono)'}}>encrypted with MXE pubkey<br />stored as opaque blob</div>
              </div>
              <div className="ef-arrow">→</div>
              <div className="ef-node">
                <div className="ef-label">03 — Arcium MXE (settlement)</div>
                <div className="ef-result">payout: $24.71<br />ZK proof: verified ✓</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:8,fontFamily:'var(--mono)'}}>MPC: no node sees plaintext<br />ZK verifies scoring</div>
              </div>
            </div>
            <div style={{marginTop:32,paddingTop:28,borderTop:'1px solid #222',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              <div><div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:8}}>WHAT&apos;S PRIVATE</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>Your prediction (YES/NO/number/outcome)<br />Your entry timing strategy<br />Your wallet association to a position</div></div>
              <div><div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:8}}>WHAT&apos;S PUBLIC</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>Pool participant count per tier<br />Total USDC staked per pool<br />Payout amounts (post-settlement only)</div></div>
              <div><div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:8}}>ARCIUM GUARANTEE</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.7}}>MPC: key shards split across nodes<br />ZK proof: scoring correctness verifiable<br />Even Cyper cannot read your prediction</div></div>
            </div>
          </div>
        </section>

        {/* MATH */}
        <section id="math">
          <div className="section-tag">// payout formulas</div>
          <h2>The math</h2>
          <p className="section-sub">Total fee = 2%. LP fee 1.5% goes to market creator. Protocol fee 0.5% goes to treasury. All math runs inside Arcium MXE.</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:2}}>
            <div style={{background:'var(--gray)',padding:32}}>
              <span className="tag-sm tag-g" style={{marginBottom:16,display:'inline-block'}}>Binary</span>
              <div className="code-block g" dangerouslySetInnerHTML={{__html:`net_pot = total × 0.98<br>YES_net = yes_count × stake × 0.98<br>NO_net  = no_count  × stake × 0.98<br><br><span style="color:var(--green)">// YES wins:</span><br>payout_i = stake_net<br>&nbsp;&nbsp;&nbsp;&nbsp;+ (stake_net / YES_net) × NO_net`}} />
            </div>
            <div style={{background:'var(--gray)',padding:32}}>
              <span className="tag-sm tag-p" style={{marginBottom:16,display:'inline-block'}}>Accuracy</span>
              <div className="code-block p" dangerouslySetInnerHTML={{__html:`error_i = |predict_i − actual|<br>sort by error ascending<br>median = sorted[floor((N+1)/2)]<br><br><span style="color:var(--purple)">won_i = error_i &lt; median</span> // strict &lt;<br>r_i = error_i / median<br>w_i = (1 / (1+r_i)) ^ 6<br><br>payout_i = stake + (w_i / Σw) × loser_pool`}} />
            </div>
            <div style={{background:'var(--gray)',padding:32}}>
              <span className="tag-sm tag-a" style={{marginBottom:16,display:'inline-block'}}>Multi-outcome (2–4)</span>
              <div className="code-block a" dangerouslySetInnerHTML={{__html:`outcomes: 2 to 4 options<br>each has own pool per tier<br><br><span style="color:var(--amber)">// winning outcome takes all:</span><br>loser_pool = Σ(all other pools)<br>net_pot = loser_pool × 0.98<br><br>payout_i = stake_net + net_pot / winner_count`}} />
            </div>
          </div>
          <div style={{marginTop:12,padding:'12px 16px',background:'var(--gray)',border:'1px solid #222',fontFamily:'var(--mono)',fontSize:11,color:'var(--text2)'}}>
            → Interactive math simulator with live editing: <a href="/" style={{color:'var(--green)'}}>math simulator →</a>
          </div>
        </section>

        {/* OWNERSHIP */}
        <section id="ownership">
          <div className="section-tag">// ownership, authority &amp; rent</div>
          <h2>Who owns what</h2>
          <p className="section-sub">On Solana, every account has three distinct properties: who paid the rent, who has program authority over it, and who can sign to interact with it.</p>
          <div style={{background:'var(--gray)',padding:'16px 20px',marginBottom:2,borderLeft:'2px solid var(--green)'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--green)',letterSpacing:'0.12em',marginBottom:6}}>SOLANA BASICS — THREE DIFFERENT THINGS</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,fontSize:13,color:'var(--text)'}}>
              <div><span style={{color:'var(--white)',fontWeight:500}}>Rent payer</span><br />Who deposited SOL to keep the account alive. Gets it back when the account is closed (if ever).</div>
              <div><span style={{color:'var(--white)',fontWeight:500}}>Program authority</span><br />Which program owns and can write to the account data. For PDAs, this is always your Solana program.</div>
              <div><span style={{color:'var(--white)',fontWeight:500}}>Signer authority</span><br />Which wallet must sign transactions that interact with this account.</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:2,marginTop:2}}>
            {[
              {bg:'var(--gray)',name:'CyperMarket PDA',sub:'Global config. 1 total.',nameColor:'var(--green)',rent:'Admin wallet',rentNote:'Pays ~0.002 SOL once at deploy.',auth:'Your Solana program',authNote:'Only the program can write to this account.',signer:'Admin wallet',signerNote:'Only admin can initialize, update_fees, pause.'},
              {bg:'var(--gray2)',name:'MarketGroup PDA',sub:'1 per event',nameColor:'var(--green)',rent:'Market creator',rentNote:'~0.004 SOL. Paid at create_market_group.',auth:'Your Solana program',authNote:'Program writes status, resolved_value, dispute_deadline.',signer:'Creator (privileged) / Anyone (lock)',signerNote:'Creator for cancel/return_bond. lock_market is permissionless.'},
              {bg:'var(--gray)',name:'Bond PDA + vault',sub:'1 per event',nameColor:'var(--amber)',rent:'Market creator',rentNote:'~0.002 SOL PDA + ~0.002 SOL vault.',auth:'bond_vault_authority PDA',authNote:'Seeds: ["bond_authority", bond.key]. No private key — program signs only.',signer:'Program only (via CPI)',signerNote:'return_bond → creator. slash_bond → treasury. Both require on-chain conditions.'},
              {bg:'var(--gray2)',name:'Market PDA ×3',sub:'3 per event (one per tier)',nameColor:'var(--green)',rent:'Market creator',rentNote:'~0.003 SOL × 3 = ~0.009 SOL.',auth:'Your Solana program',authNote:'Program updates status, participants, volume.',signer:'Creator (creation only)',signerNote:'has_one = creator on parent MarketGroup.'},
              {bg:'var(--gray)',name:'Pool PDA + vault',sub:'2–4 per market per tier',nameColor:'var(--purple)',rent:'Market creator',rentNote:'~0.002 SOL pool + ~0.002 SOL vault each.',auth:'pool_vault_authority PDA',authNote:'Seeds: ["vault_authority", pool.key]. Only program signs.',signer:'Program only (settle + claim)',signerNote:'USDC out via settle_callback (fees) or claim_payout (user).'},
              {bg:'var(--gray2)',name:'Position PDA',sub:'1 per user per pool',nameColor:'var(--purple)',rent:'The bettor',rentNote:'~0.003 SOL per bet. Hidden cost users pay.',auth:'Your Solana program',authNote:'Program writes payout and status. Backend writes via write_position_payouts.',signer:'User (claim only)',signerNote:'PDA seeds include user.pubkey — only they can claim.'},
            ].map(row => (
              <div key={row.name} style={{background:row.bg,padding:'24px 28px',display:'grid',gridTemplateColumns:'200px 1fr 1fr 1fr',gap:16,alignItems:'start'}}>
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:11,color:row.nameColor,marginBottom:4}}>{row.name}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)'}}>{row.sub}</div>
                </div>
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:4,letterSpacing:'0.06em'}}>RENT PAID BY</div>
                  <div style={{fontSize:13,color:'var(--white)'}}>{row.rent}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{row.rentNote}</div>
                </div>
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:4,letterSpacing:'0.06em'}}>PROGRAM / CUSTODY</div>
                  <div style={{fontSize:13,color:'var(--white)'}}>{row.auth}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{row.authNote}</div>
                </div>
                <div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text2)',marginBottom:4,letterSpacing:'0.06em'}}>SIGNER AUTHORITY</div>
                  <div style={{fontSize:13,color:'var(--white)'}}>{row.signer}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{row.signerNote}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Rent summary */}
          <div style={{marginTop:2,background:'var(--gray)',padding:28,borderLeft:'2px solid var(--amber)'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--amber)',letterSpacing:'0.12em',marginBottom:16}}>RENT COST SUMMARY</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
              {[
                {title:'Market creator pays',items:['MarketGroup PDA: ~0.004 SOL','Bond PDA + vault: ~0.004 SOL','3× Market PDAs: ~0.009 SOL','6× Pool PDAs (binary): ~0.012 SOL','6× Pool vaults: ~0.012 SOL'],total:'~0.041 SOL (~$8 at $200 SOL)',note:'Plus $10 USDC bond (returned)'},
                {title:'Each bettor pays',items:['Position PDA rent: ~0.003 SOL','Transaction fee: ~0.00001 SOL'],total:'~0.003 SOL (~$0.60)',note:'Plus the USDC bet ($1/$10/$100)'},
                {title:'Your backend pays',items:['lock_market tx: ~0.00001 SOL','queue_settlement ×N: ~0.0001 SOL','write_position_payouts ×N: ~0.0002 SOL'],total:'~0.001 SOL per market',note:'$10 SOL covers thousands of markets'},
              ].map(col => (
                <div key={col.title}>
                  <div style={{fontSize:13,color:'var(--white)',fontWeight:500,marginBottom:8}}>{col.title}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text)',lineHeight:2}}>
                    {col.items.map(i => <div key={i}>{i}</div>)}
                    <div style={{color:'var(--amber)'}}>{col.total}</div>
                    <div style={{color:'var(--text2)'}}>{col.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Vault authority chain */}
          <div style={{marginTop:2,background:'var(--gray)',padding:28,borderLeft:'2px solid var(--purple)'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--purple)',letterSpacing:'0.12em',marginBottom:16}}>THE VAULT AUTHORITY CHAIN</div>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)',lineHeight:2.2,background:'var(--gray2)',padding:20}} dangerouslySetInnerHTML={{__html:`
              <span style="color:var(--white)">Pool vault</span> (token account)<br>
              &nbsp;&nbsp;└── authority = <span style="color:var(--purple)">pool_vault_authority PDA</span> (seeds: ["vault_authority", pool.key])<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── program signs in 2 instructions only:<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;settle_callback → fees (requires valid ZK proof)<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;claim_payout → user (requires position.status == SETTLED)<br>
              <br>
              <span style="color:var(--white)">Bond vault</span> (token account)<br>
              &nbsp;&nbsp;└── authority = <span style="color:var(--amber)">bond_vault_authority PDA</span> (seeds: ["bond_authority", bond.key])<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── return_bond → creator (requires market.status == SETTLED)<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── slash_bond → treasury (requires deadline passed + no resolution)<br>
              <br>
              <span style="color:var(--text2)">// No human wallet can ever directly sign a transfer from any vault.</span>
            `}} />
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
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:28,color:'var(--white)',marginBottom:12}}>CYPER<span style={{color:'var(--green)'}}>.</span></div>
            <div style={{fontSize:13,color:'var(--text2)',maxWidth:280,lineHeight:1.6}}>Private prediction markets on Solana. Your bets stay yours until settlement.</div>
          </div>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:16}}>// product</div>
            {[['#markets','Binary markets'],['#markets','Accuracy markets'],['#markets','Multi-outcome markets'],['#tiers','Tiered lobbies']].map(([href,label]) => (
              <a key={label} href={href} style={{display:'block',fontSize:13,color:'var(--text2)',textDecoration:'none',marginBottom:10}}>{label}</a>
            ))}
          </div>
          <div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:16}}>// technical</div>
            {[['#arch','Architecture'],['#ownership','Ownership & rent'],['#encryption','Arcium encryption'],['#math','Payout formulas'],['#faq','FAQ'],['/', 'Math simulator →']].map(([href,label]) => (
              <a key={label} href={href} style={{display:'block',fontSize:13,color:'var(--text2)',textDecoration:'none',marginBottom:10}}>{label}</a>
            ))}
          </div>
          <div style={{gridColumn:'1/-1',paddingTop:28,borderTop:'1px solid #222',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text2)'}}>© 2025 Cyper Protocol. Built on Solana.</div>
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
