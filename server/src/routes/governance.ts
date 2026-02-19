import { Router, type Request, type Response } from "express"
import { governanceLog } from "../store/governance-log.js"

export const governanceRouter = Router()

governanceRouter.get("/actions", (_req: Request, res: Response) => {
  res.json(governanceLog.getAll())
})

governanceRouter.delete("/actions", (_req: Request, res: Response) => {
  governanceLog.clear()
  res.json({ success: true })
})
