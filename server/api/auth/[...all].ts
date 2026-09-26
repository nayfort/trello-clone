import { getAuth } from '../../lib/auth';
import { authHeaders } from '../../lib/request-headers';
export default defineEventHandler((event) =>
  getAuth().handler(
    new Request(toWebRequest(event), { headers: authHeaders(event) }),
  ),
);
