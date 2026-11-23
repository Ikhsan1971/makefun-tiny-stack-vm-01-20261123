// tiny-stack-vm: interpreter for make.fun's tiny stack ISA (ISA.md), written from the spec.
import { mkdirSync as K, readdirSync as R, readFileSync as F, writeFileSync as W } from 'node:fs';
import { join as J } from 'node:path';
const L = 1e6, O = 65536, T = 256, C = 64, M = 256;
// valid opcodes: 00-07, 10-1e, 20-22, 30-34, 40-41, 50-53
const V = new Uint8Array(256);
for (const [a, b] of [[0, 7], [16, 30], [32, 34], [48, 52], [64, 65], [80, 83]]) for (let i = a; i <= b; i++) V[i] = 1;
const A = (o) => (o >= 16 && o <= 22) || (o >= 24 && o <= 30 && o !== 27) || (o >= 32 && o <= 34);

function run(p, inp) {
  const n = p.length, d = new Int32Array(T), mm = new Int32Array(M), c = new Int32Array(C), out = new Uint8Array(O);
  let s = 0, cp = 0, ol = 0, ip = 0, pc = 0, st = 0;
  const E = (x) => ({ stdout: out.subarray(0, ol), exit: x });
  for (;;) {
    if (st === L) return E(10);
    if (pc < 0 || pc >= n) return E(9);
    const o = p[pc];
    if (!V[o]) return E(5);
    const m = o === 1 ? 1 : o === 2 ? 4 : o > 47 && o < 52 ? 2 : 0;
    if (pc + m >= n) return E(9);
    st++;
    const q = o === 7 ? 3 : o === 5 || o === 6 || o === 65 || A(o) ? 2 : o === 3 || o === 4 || o === 23 || o === 27 || o === 49 || o === 50 || o === 64 || o === 80 || o === 81 || o === 83 ? 1 : 0;
    const u = o === 4 ? 2 : o === 6 ? 3 : o === 1 || o === 2 || o === 23 || o === 27 || o === 64 || o === 82 || A(o) ? 1 : 0;
    if (s < q) return E(2);
    if (s - q + u > T) return E(3);
    const w = pc + 1 + m;
    pc = w;
    switch (o) {
      case 0: return E(0);
      case 1: d[s++] = (p[w - 1] << 24) >> 24; break;
      case 2: d[s++] = p[w - 4] | (p[w - 3] << 8) | (p[w - 2] << 16) | (p[w - 1] << 24); break;
      case 3: s--; break;
      case 4: d[s] = d[s - 1]; s++; break;
      case 5: { const x = d[s - 1]; d[s - 1] = d[s - 2]; d[s - 2] = x; break; }
      case 6: d[s] = d[s - 2]; s++; break;
      case 7: { const x = d[s - 3]; d[s - 3] = d[s - 2]; d[s - 2] = d[s - 1]; d[s - 1] = x; break; }
      case 23: d[s - 1] = -d[s - 1] | 0; break;
      case 27: d[s - 1] = ~d[s - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34: {
        const b = d[s - 1], a = d[s - 2];
        let r;
        if (o === 16) r = a + b | 0;
        else if (o === 17) r = a - b | 0;
        else if (o === 18) r = Math.imul(a, b);
        else if (o === 19) { if (b === 0) return E(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
        else if (o === 20) { if (b === 0) return E(4); r = b === -1 ? 0 : a % b | 0; }
        else if (o === 21) { if (b === 0) return E(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (o === 22) { if (b === 0) return E(4); r = (a >>> 0) % (b >>> 0) | 0; }
        else if (o === 24) r = a & b;
        else if (o === 25) r = a | b;
        else if (o === 26) r = a ^ b;
        else if (o === 28) r = a << (b & 31);
        else if (o === 29) r = a >> (b & 31);
        else if (o === 30) r = (a >>> (b & 31)) | 0;
        else if (o === 32) r = a === b ? 1 : 0;
        else if (o === 33) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        s -= 2; d[s++] = r; break;
      }
      case 48: case 49: case 50: {
        const rel = ((p[w - 2] | (p[w - 1] << 8)) << 16) >> 16;
        let go = 1;
        if (o !== 48) { const x = d[--s]; go = o === 49 ? x === 0 : x !== 0; }
        if (go) pc = w + rel;
        break;
      }
      case 51: if (cp === C) return E(7); c[cp++] = w; pc = p[w - 2] | (p[w - 1] << 8); break;
      case 52: if (cp === 0) return E(8); pc = c[--cp]; break;
      case 64: { const x = d[s - 1]; if (x < 0 || x >= M) return E(6); d[s - 1] = mm[x]; break; }
      case 65: { const x = d[s - 1], v = d[s - 2]; if (x < 0 || x >= M) return E(6); s -= 2; mm[x] = v; break; }
      case 80: {
        const t = String(d[s - 1]);
        if (ol + t.length > O) return E(11);
        for (let i = 0; i < t.length; i++) out[ol++] = t.charCodeAt(i);
        s--; break;
      }
      case 81: if (ol + 1 > O) return E(11); out[ol++] = d[--s] & 255; break;
      case 82: d[s++] = ip < inp.length ? inp[ip++] : -1; break;
      default: return E(d[--s] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', P = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of R(I).sort()) {
  const r = run(new Uint8Array(F(J(I, id, 'program.bin'))), new Uint8Array(F(J(I, id, 'input.bin'))));
  K(J(P, id), { recursive: true });
  W(J(P, id, 'stdout.bin'), r.stdout);
  W(J(P, id, 'exit.txt'), String(r.exit));
}
