export const handler = async (event) => {
  // Debug: log what Netlify gives us so we can verify path extraction
  const rawPath = event.rawUrl
    ? new URL(event.rawUrl).pathname
    : event.path

  console.log('[jira] event.path    :', event.path)
  console.log('[jira] event.rawUrl  :', event.rawUrl)
  console.log('[jira] rawPath       :', rawPath)

  const jiraPath = rawPath.replace(/^\/api\/jira/, '')
  const query = event.rawUrl ? new URL(event.rawUrl).search : (event.rawQuery ? `?${event.rawQuery}` : '')
  const targetUrl = `https://billingplatform.atlassian.net${jiraPath}${query}`

  console.log('[jira] targetUrl     :', targetUrl)

  const token = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString('base64')

  const response = await fetch(targetUrl, {
    method: event.httpMethod,
    headers: {
      Authorization: `Basic ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(event.body ? { body: event.body } : {}),
  })

  const body = await response.text()
  console.log('[jira] jira status   :', response.status)

  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json' },
    body,
  }
}
