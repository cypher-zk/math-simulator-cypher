// ═══════════════════════════════════════════════════════════════════
//  CYPER MARKET — EXACT MATH ENGINE
//  TypeScript port of circuits.rs — identical algorithm
//  All USDC amounts use 6 decimal places (1 USDC = 1_000_000 units)
// ═══════════════════════════════════════════════════════════════════

export interface YesNoTrader { name: string; stake: number; side: 'YES' | 'NO' }
export interface MultiTrader { name: string; stake: number; outcome: number }
export interface AccuracyTrader { name: string; stake: number; prediction: number }

export function computeFees(totalPool: number, lpBps: number, protoBps: number) {
  const lpFee = Math.floor((totalPool * lpBps) / 10000)
  const protocolFee = Math.floor((totalPool * protoBps) / 10000)
  return { lpFee, protocolFee, netPool: totalPool - lpFee - protocolFee }
}

// ── YES/NO ────────────────────────────────────────────────────────
export interface YesNoTraderResult extends YesNoTrader {
  stakeNet: number; won: boolean; payout: number; profit: number; roi: number
}
export interface YesNoResult {
  traders: YesNoTraderResult[]
  resolvedSide: 'YES' | 'NO'
  totalPool: number; yesPool: number; noPool: number
  lpFee: number; protocolFee: number; loserPool: number
  winnerCount: number; loserCount: number
}

export function settleYesNo(
  traders: YesNoTrader[], resolvedSide: 'YES' | 'NO',
  lpBps: number, protoBps: number
): YesNoResult {
  const feeRatio = (lpBps + protoBps) / 10000
  const totalPool = traders.reduce((s, t) => s + t.stake, 0)
  const { lpFee, protocolFee } = computeFees(totalPool, lpBps, protoBps)

  const yesRaw = traders.filter(t => t.side === 'YES').reduce((s, t) => s + t.stake, 0)
  const noRaw  = traders.filter(t => t.side === 'NO' ).reduce((s, t) => s + t.stake, 0)
  const yesNet = yesRaw - Math.floor(yesRaw * feeRatio)
  const noNet  = noRaw  - Math.floor(noRaw  * feeRatio)

  const winnerPoolNet = resolvedSide === 'YES' ? yesNet : noNet
  const loserPool     = resolvedSide === 'YES' ? noNet  : yesNet

  const traderResults: YesNoTraderResult[] = traders.map(t => {
    const sn = t.stake - Math.floor(t.stake * feeRatio)
    const won = t.side === resolvedSide
    let payout = 0
    if (won && winnerPoolNet > 0) {
      // payout = stake_net + (stake_net / winner_pool_net) × loser_pool
      payout = sn + Math.floor((sn / winnerPoolNet) * loserPool)
    }
    return { ...t, stakeNet: sn, won, payout, profit: payout - t.stake, roi: t.stake > 0 ? ((payout - t.stake) / t.stake) * 100 : 0 }
  })

  return {
    traders: traderResults, resolvedSide, totalPool,
    yesPool: yesRaw, noPool: noRaw, lpFee, protocolFee,
    loserPool, winnerCount: traderResults.filter(t => t.won).length,
    loserCount: traderResults.filter(t => !t.won).length,
  }
}

// ── MULTI-OUTCOME ─────────────────────────────────────────────────
export interface MultiTraderResult extends MultiTrader {
  stakeNet: number; won: boolean; payout: number; profit: number; roi: number
}
export interface MultiOutcomeResult {
  traders: MultiTraderResult[]
  resolvedOutcome: number; outcomeLabels: string[]
  totalPool: number; outcomePools: number[]; outcomePoolsNet: number[]
  lpFee: number; protocolFee: number; loserPool: number
  winnerCount: number; loserCount: number
}

export function settleMultiOutcome(
  traders: MultiTrader[], resolvedOutcome: number, outcomeLabels: string[],
  lpBps: number, protoBps: number
): MultiOutcomeResult {
  const feeRatio = (lpBps + protoBps) / 10000
  const totalPool = traders.reduce((s, t) => s + t.stake, 0)
  const { lpFee, protocolFee } = computeFees(totalPool, lpBps, protoBps)

  const outcomePools = outcomeLabels.map((_, i) =>
    traders.filter(t => t.outcome === i).reduce((s, t) => s + t.stake, 0))
  const outcomePoolsNet = outcomePools.map(p => p - Math.floor(p * feeRatio))

  const winnerPoolNet = outcomePoolsNet[resolvedOutcome] ?? 0
  const loserPool = outcomePoolsNet.reduce((s, p, i) => i !== resolvedOutcome ? s + p : s, 0)

  const traderResults: MultiTraderResult[] = traders.map(t => {
    const sn = t.stake - Math.floor(t.stake * feeRatio)
    const won = t.outcome === resolvedOutcome
    let payout = 0
    if (won && winnerPoolNet > 0) {
      payout = sn + Math.floor((sn / winnerPoolNet) * loserPool)
    }
    return { ...t, stakeNet: sn, won, payout, profit: payout - t.stake, roi: t.stake > 0 ? ((payout - t.stake) / t.stake) * 100 : 0 }
  })

  return {
    traders: traderResults, resolvedOutcome, outcomeLabels, totalPool,
    outcomePools, outcomePoolsNet, lpFee, protocolFee, loserPool,
    winnerCount: traderResults.filter(t => t.won).length,
    loserCount: traderResults.filter(t => !t.won).length,
  }
}

// ── ACCURACY (exact port of settle_accuracy in circuits.rs) ───────
const SCALE = 10000n

export interface AccuracyTraderResult extends AccuracyTrader {
  error: number; sigmaAway: number; won: boolean
  weight: bigint; weightPct: number
  stakeNet: number; payout: number; profit: number; roi: number
}
export interface AccuracyResult {
  traders: AccuracyTraderResult[]
  resolvedValue: number; totalPool: number
  lpFee: number; protocolFee: number; loserPool: number
  medianError: number; winnerCount: number; loserCount: number
}

export function settleAccuracy(
  traders: AccuracyTrader[], resolvedValue: number,
  lpBps: number, protoBps: number, decayExp: number = 6
): AccuracyResult {
  const n = traders.length
  if (n === 0) return { traders: [], resolvedValue, totalPool: 0, lpFee: 0, protocolFee: 0, loserPool: 0, medianError: 0, winnerCount: 0, loserCount: 0 }

  const feeRatio = (lpBps + protoBps) / 10000
  const stakeNetFn = (s: number) => s - Math.floor(s * feeRatio)

  // Step 1+2: errors and sort
  const indexed = traders.map((t, i) => ({ ...t, idx: i, error: Math.abs(t.prediction - resolvedValue) }))
  const sorted = [...indexed].sort((a, b) => a.error - b.error)

  // Step 3: median  k = floor((N+1)/2), 0-indexed = k-1
  const k = Math.floor((n + 1) / 2)
  const medianError = sorted[k - 1].error

  // Step 4: won = error < medianError (strict — exact from Rust)
  // Step 5: pools
  const totalPool = traders.reduce((s, t) => s + t.stake, 0)
  const { lpFee, protocolFee } = computeFees(totalPool, lpBps, protoBps)
  const losers = sorted.filter(s => s.error >= medianError)
  const loserPool = losers.reduce((s, t) => s + stakeNetFn(t.stake), 0)

  // Step 6: weights — exact bigint from circuits.rs
  type WW = { idx: number; w: bigint }
  const wws: WW[] = []
  let totalWeight = 0n
  for (const s of sorted) {
    if (s.error >= medianError) continue
    const relErr = medianError === 0 ? 0n : BigInt(Math.floor((s.error * Number(SCALE)) / medianError))
    const denom = SCALE + relErr
    let w = 1n
    for (let e = 0; e < decayExp; e++) w = (w * SCALE) / denom
    totalWeight += w
    wws.push({ idx: s.idx, w })
  }

  // Step 7: payouts
  const payouts = new Array(n).fill(0)
  const weights = new Map(wws.map(w => [w.idx, w.w]))
  if (totalWeight > 0n) {
    for (const ww of wws) {
      const sn = stakeNetFn(traders[ww.idx].stake)
      const share = Number((ww.w * BigInt(loserPool)) / totalWeight)
      payouts[ww.idx] = sn + share
    }
  }

  const winnerCount = wws.length
  const loserCount  = n - winnerCount

  const traderResults: AccuracyTraderResult[] = traders.map((t, i) => {
    const error = Math.abs(t.prediction - resolvedValue)
    const w = weights.get(i) ?? 0n
    const won = payouts[i] > 0
    const payout = payouts[i]
    return {
      ...t, error,
      sigmaAway: medianError > 0 ? error / medianError : 0,
      won, weight: w,
      weightPct: totalWeight > 0n ? Number((w * 10000n) / totalWeight) / 100 : 0,
      stakeNet: stakeNetFn(t.stake), payout, profit: payout - t.stake,
      roi: t.stake > 0 ? ((payout - t.stake) / t.stake) * 100 : 0,
    }
  })

  return { traders: traderResults, resolvedValue, totalPool, lpFee, protocolFee, loserPool, medianError, winnerCount, loserCount }
}

// ── FORMAT ────────────────────────────────────────────────────────
export const fmtU = (raw: number) => '$' + (raw / 1_000_000).toFixed(2)
export const fmtUShort = (raw: number) => {
  const v = raw / 1_000_000
  return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2)
}
export const toRaw = (d: number) => Math.round(d * 1_000_000)
export const toDollars = (raw: number) => raw / 1_000_000
