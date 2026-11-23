export interface LinearTeam {
  id: string
  name: string
  key: string
}

export interface LinearIssueResult {
  id: string
  identifier: string // e.g. 'ENG-142'
  title: string
  url: string
  status: string // e.g. 'In Progress', 'Done'
  stateType: string // 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
}

export interface IssueTrackerProvider {
  testConnection(
    apiKey: string,
  ): Promise<{ success: boolean; organizationName?: string }>
  listTeams(apiKey: string): Promise<LinearTeam[]>
  createIssue(
    apiKey: string,
    input: {
      teamId: string
      title: string
      description?: string
      priority?: number
      postUrl?: string
    },
  ): Promise<LinearIssueResult>
  getIssue(apiKey: string, issueIdOrKey: string): Promise<LinearIssueResult>
}
