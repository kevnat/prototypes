export const handler = async (event) => {
  const jiraPath = event.path.replace('/api/jira', '')
  const query = event.rawQuery ? `?${event.rawQuery}` : ''
  const token = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString('base64')

  const response = await fetch(
    `https://billingplatform.atlassian.net${jiraPath}${query}`,
    {
      method: event.httpMethod,
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...(event.body ? { body: event.body } : {}),
    }
  )
  const body = await response.text()
  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json' },
    body,
  }
}
