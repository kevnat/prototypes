import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const { JIRA_EMAIL, JIRA_API_TOKEN } = env
  const authHeader = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

  const jiraProxyPlugin = {
    name: 'jira-proxy',
    configureServer(server) {
      server.middlewares.use('/api/jira', (req, res) => {
        const jiraPath = req.url || '/'
        const options = {
          hostname: 'billingplatform.atlassian.net',
          path: jiraPath,
          method: req.method,
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
            'Content-Type': req.headers['content-type'] || 'application/json',
          },
        }

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          })
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (err) => {
          res.writeHead(502)
          res.end(JSON.stringify({ error: err.message }))
        })

        req.pipe(proxyReq)
      })
    },
  }

  return {
    plugins: [react(), jiraProxyPlugin],
  }
})
