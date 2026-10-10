import { handleAdmin } from '../server/admin'
const h = (req: Request) => handleAdmin(req)
export const GET = h
export const POST = h
