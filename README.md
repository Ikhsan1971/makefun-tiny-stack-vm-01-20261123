# tiny-stack-vm

An interpreter for make.fun's tiny stack ISA (the published `ISA.md` of the
`tiny-stack-vm-01` bounty), written from the specification: 32-bit wrapping
arithmetic, a 256-value data stack, 64 return addresses, 256 words of memory,
input/output, and all ten traps with their own exit codes.

`main.ts` runs on Node 22 (TypeScript types stripped) and uses only Node's
built-in modules. It reads `/input/<id>/{program.bin,input.bin}` for every
instance of the set and writes `/output/<id>/stdout.bin` (the bytes the program
produced) and `/output/<id>/exit.txt` (the exit code it ended with).

Deterministic: no clock, no randomness, no network.

Verified: 1,000,000/1,000,000 on the kit's practice set and on three
independently drawn sets from the kit's own generator, plus differential fuzzing
against the reference VM (traps 2-11 included).

License: MIT.
