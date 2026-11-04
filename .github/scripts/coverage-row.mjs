// Formats an Istanbul coverage-summary.json as markdown for CI.
// Usage: node coverage-row.mjs <suite> <coverage-summary.json> [table.md]
// Writes the totals to the job summary. With table.md, also appends a row to it.
import { appendFileSync, readFileSync } from 'node:fs'

const [suite, summaryPath, tablePath] = process.argv.slice(2)
const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'))
const percentages = ['statements', 'branches', 'functions', 'lines'].map((metric) => `${total[metric].pct} %`)

const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_SHA, GITHUB_RUN_ID, GITHUB_STEP_SUMMARY } = process.env
const repoUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}`

const summary = [
  `### Coverage: ${suite}`,
  '| Statements | Branches | Functions | Lines |',
  '|---|---|---|---|',
  `| ${percentages.join(' | ')} |`,
].join('\n')
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${summary}\n`)
else console.log(summary)

if (tablePath) {
  const date = new Date().toISOString().slice(0, 10)
  const commit = `[\`${GITHUB_SHA.slice(0, 7)}\`](${repoUrl}/commit/${GITHUB_SHA})`
  const run = `[${GITHUB_RUN_ID}](${repoUrl}/actions/runs/${GITHUB_RUN_ID})`
  appendFileSync(tablePath, `| ${[date, commit, ...percentages, run].join(' | ')} |\n`)
}
