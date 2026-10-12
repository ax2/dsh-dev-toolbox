// Prepublish gate for a bundle-only package: there is no build and no test
// suite here, so the thing that can silently break is the patch/dependency
// agreement. Verify it without pulling in a YAML parser.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')

const problems = []
const expected = Object.keys(pkg.dependencies ?? {})
const inserted = [...patch.matchAll(/^\s*-?\s*id:\s*([a-z0-9-]+)\s*$/gmu)].map((m) => m[1])
const names = [...patch.matchAll(/^\s*name:\s*([@a-z0-9/._-]+)\s*$/gmu)].map((m) => m[1])

if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml') problems.push('dsh.bundle.patch must point at ./cordis.patch.yml')
if (!pkg.files?.includes('cordis.patch.yml')) problems.push('files[] must ship cordis.patch.yml')
if (inserted.length !== expected.length) {
  problems.push(`patch inserts ${inserted.length} rows but package.json declares ${expected.length} dependencies`)
}
for (const dep of expected) {
  if (!names.includes(dep)) problems.push(`no patch row references the dependency ${dep}`)
  if (!/^\d+\.\d+\.\d+/.test(pkg.dependencies[dep]) && !pkg.dependencies[dep].startsWith('^')) {
    problems.push(`dependency ${dep} has a range that is not caret-pinned: ${pkg.dependencies[dep]}`)
  }
}
for (const name of names) {
  if (name.startsWith('@deepseek-ai/')) continue
  if (!expected.includes(name)) problems.push(`patch row references ${name}, which is not a dependency`)
}
if (problems.length > 0) {
  for (const p of problems) console.error(`FAIL ${p}`)
  process.exit(1)
}
console.log(`OK ${inserted.length} rows: ${names.join(', ')}`)
