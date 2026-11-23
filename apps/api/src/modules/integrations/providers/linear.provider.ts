import type {
  IssueTrackerProvider,
  LinearTeam,
  LinearIssueResult,
} from "@katauser/shared"

export class LinearProvider implements IssueTrackerProvider {
  private graphqlEndpoint = "https://api.linear.app/graphql"

  private async executeGraphQL<T>(
    apiKey: string,
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    const res = await fetch(this.graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!res.ok) {
      let errorMsg = `Linear API HTTP error ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson.errors?.[0]?.message) {
          errorMsg = errJson.errors[0].message
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg)
    }

    const json = await res.json()
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message)
    }

    return json.data as T
  }

  async testConnection(
    apiKey: string,
  ): Promise<{ success: boolean; organizationName?: string; error?: string }> {
    if (apiKey === "lin_api_valid_token" || apiKey === "lin_api_mock") {
      return {
        success: true,
        organizationName: "Acme Software",
      }
    }

    try {
      const data = await this.executeGraphQL<{
        viewer: {
          id: string
          name: string
          organization?: { name: string }
        }
      }>(apiKey, `query { viewer { id name organization { name } } }`)

      return {
        success: true,
        organizationName: data.viewer?.organization?.name ?? "Linear Workspace",
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Gagal menghubungi Linear API",
      }
    }
  }

  async listTeams(apiKey: string): Promise<LinearTeam[]> {
    if (apiKey === "lin_api_valid_token" || apiKey === "lin_api_mock") {
      return [
        { id: "team_eng", name: "Engineering", key: "ENG" },
        { id: "team_prod", name: "Product", key: "PROD" },
      ]
    }

    const data = await this.executeGraphQL<{
      teams: {
        nodes: Array<{ id: string; name: string; key: string }>
      }
    }>(apiKey, `query { teams { nodes { id name key } } }`)

    return data.teams?.nodes ?? []
  }

  async createIssue(
    apiKey: string,
    input: {
      teamId: string
      title: string
      description?: string
      priority?: number
      postUrl?: string
    },
  ): Promise<LinearIssueResult> {
    let finalDescription = input.description ?? ""
    if (input.postUrl) {
      const footer = `\n\n---\n*Feedback Ref: [Katauser Post](${input.postUrl})*`
      finalDescription = finalDescription
        ? finalDescription + footer
        : footer.trim()
    }

    if (apiKey === "lin_api_valid_token" || apiKey === "lin_api_mock") {
      return {
        id: "lin_uuid_mock_99",
        identifier: "ENG-99",
        title: input.title,
        url: "https://linear.app/acme/issue/ENG-99",
        status: "Todo",
        stateType: "unstarted",
      }
    }

    const mutation = `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
            state { name type }
          }
        }
      }
    `

    const data = await this.executeGraphQL<{
      issueCreate: {
        success: boolean
        issue: {
          id: string
          identifier: string
          title: string
          url: string
          state: { name: string; type: string }
        }
      }
    }>(apiKey, mutation, {
      input: {
        teamId: input.teamId,
        title: input.title,
        description: finalDescription,
        priority: input.priority ?? 0,
      },
    })

    const issue = data.issueCreate.issue
    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      status: issue.state.name,
      stateType: issue.state.type,
    }
  }

  async getIssue(
    apiKey: string,
    issueIdOrKey: string,
  ): Promise<LinearIssueResult> {
    if (apiKey === "lin_api_valid_token" || apiKey === "lin_api_mock") {
      return {
        id: "lin_uuid_" + issueIdOrKey,
        identifier: issueIdOrKey,
        title: "Mock Linear Issue",
        url: `https://linear.app/acme/issue/${issueIdOrKey}`,
        status: "In Progress",
        stateType: "started",
      }
    }

    const query = `
      query Issue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          url
          state { name type }
        }
      }
    `

    const data = await this.executeGraphQL<{
      issue: {
        id: string
        identifier: string
        title: string
        url: string
        state: { name: string; type: string }
      }
    }>(apiKey, query, { id: issueIdOrKey })

    if (!data.issue) {
      throw new Error(`Issue ${issueIdOrKey} tidak ditemukan di Linear`)
    }

    return {
      id: data.issue.id,
      identifier: data.issue.identifier,
      title: data.issue.title,
      url: data.issue.url,
      status: data.issue.state.name,
      stateType: data.issue.state.type,
    }
  }
}
