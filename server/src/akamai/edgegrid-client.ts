import EdgeGrid from "akamai-edgegrid"
import { config } from "../config.js"

const eg = new EdgeGrid({
  path: config.edgercPath,
  section: config.edgercSection,
})

export async function akamaiApiRequest(
  method: string,
  path: string,
  body?: object,
  headers?: Record<string, string>
): Promise<{ statusCode: number; body: any; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    eg.auth({
      path,
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    })
    eg.send((err: any, response: any, responseBody?: string) => {
      if (err) return reject(err)
      let parsed: any
      try {
        parsed = responseBody ? JSON.parse(responseBody) : null
      } catch {
        parsed = responseBody
      }
      resolve({
        statusCode: response.statusCode,
        body: parsed,
        headers: response.headers,
      })
    })
  })
}
