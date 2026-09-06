import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseURL = 'http://127.0.0.1:5173'
const artifactDir = path.join('test-results')
await mkdir(artifactDir, { recursive: true })

const modules = ['clients', 'production', 'installation', 'cycle', 'warehouse', 'marketing', 'tasks', 'ai', 'board']
const worker = { id: 2, email: 'worker@example.test', full_name: 'Сотрудник производства', role: 'worker', module_access: ['production'], is_active: true, created_at: '2026-09-05T08:00:00Z' }
const admin = { ...worker, id: 1, email: 'owner@example.test', full_name: 'Руководитель', role: 'admin', module_access: modules }

async function openAs(user, viewport = { width: 1440, height: 1100 }) {
  const context = await chromium.launch({ headless: true }).then((browser) => browser.newContext({ viewport }).then((ctx) => ({ browser, ctx })))
  await context.ctx.addInitScript(() => {
    localStorage.setItem('soborbum.auth.token', 'browser-test-token')
    for (const id of ['today', 'admin', 'production', 'ai', 'agents']) localStorage.setItem(`soborbum.onboarding.${id}`, '1')
  })
  const page = await context.ctx.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort())
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/auth/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  return { ...context, page, errors }
}

const owner = await openAs(admin)
await owner.page.goto(baseURL + '/agents')
await owner.page.getByRole('heading', { name: 'Агенты.' }).waitFor()
assert(await owner.page.getByRole('navigation').getByRole('link', { name: 'Агенты', exact: true }).isVisible())
assert.equal(await owner.page.getByRole('link', { name: 'Совет директоров', exact: true }).count(), 1)
await owner.page.getByRole('button', { name: 'Юрист', exact: true }).click()
await owner.page.getByText('Вердикт legal gate', { exact: false }).waitFor()
await owner.page.getByRole('tab', { name: 'Панель' }).click()
await owner.page.getByRole('heading', { name: 'Разметка до «обучен»' }).waitFor()
await owner.page.screenshot({ path: path.join(artifactDir, 'agents-admin-panel.png'), fullPage: true })
await owner.page.getByRole('tab', { name: 'Команда' }).click()
await owner.page.screenshot({ path: path.join(artifactDir, 'agents-admin-team.png'), fullPage: true })
assert.deepEqual(owner.errors, [])
await owner.ctx.close()
await owner.browser.close()

const employee = await openAs(worker)
await employee.page.goto(baseURL + '/agents')
await employee.page.getByRole('heading', { name: 'Агенты.' }).waitFor()
assert.equal(await employee.page.getByRole('tab', { name: 'Панель' }).count(), 0)
await employee.page.getByText('Уже сделано').waitFor()
await employee.page.screenshot({ path: path.join(artifactDir, 'agents-worker-team.png'), fullPage: true })
assert.deepEqual(employee.errors, [])
await employee.ctx.close()
await employee.browser.close()

const mobile = await openAs(admin, { width: 390, height: 844 })
await mobile.page.goto(baseURL + '/agents')
await mobile.page.getByRole('heading', { name: 'Агенты.' }).waitFor()
assert(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
await mobile.page.screenshot({ path: path.join(artifactDir, 'agents-admin-mobile.png'), fullPage: true })
await mobile.ctx.close()
await mobile.browser.close()

console.log('PASS agents admin team+panel, worker without panel, 390px no overflow')
