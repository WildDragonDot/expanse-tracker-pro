jest.mock('next/server', () => ({}))

jest.mock('../../src/lib/database', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}))

const { verifyToken: mockVerifyToken } = jest.requireMock('../../src/lib/database') as {
  verifyToken: jest.Mock
}

if (typeof Response === 'undefined') {
  global.Response = class {
    body: string
    status: number
    headers: Headers

    constructor(body: string, init?: ResponseInit) {
      this.body = body
      this.status = init?.status ?? 200
      this.headers = new Headers(init?.headers)
    }

    async json() {
      return JSON.parse(this.body)
    }
  } as any
}

import { getAuthUser, withAuth } from '@/lib/auth'

describe('auth', () => {
  beforeEach(() => {
    mockVerifyToken.mockReset()
  })

  it('returns decoded auth user for a valid bearer token', async () => {
    mockVerifyToken.mockReturnValue({ userId: 'user-1' })

    const request = {
      headers: new Headers({ authorization: 'Bearer valid-token' }),
    }

    await expect(getAuthUser(request as any)).resolves.toEqual({ userId: 'user-1' })
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
  })

  it('returns null when auth header is missing or token verification fails', async () => {
    mockVerifyToken.mockReturnValue(null)

    await expect(getAuthUser({ headers: new Headers() } as any)).resolves.toBeNull()
    await expect(
      getAuthUser({ headers: new Headers({ authorization: 'Bearer broken' }) } as any)
    ).resolves.toBeNull()
  })

  it('wraps handlers with authorization checks', async () => {
    mockVerifyToken.mockReturnValue({ userId: 'user-9' })
    const handler = jest.fn(async (_request, context) => new Response(JSON.stringify(context), { status: 200 }))
    const wrapped = withAuth(handler)

    const authorizedResponse = await wrapped({
      headers: new Headers({ authorization: 'Bearer good-token' }),
    } as any)
    const unauthorizedResponse = await wrapped({ headers: new Headers() } as any)

    expect(handler).toHaveBeenCalledWith(expect.anything(), { userId: 'user-9' })
    await expect((authorizedResponse as any).json()).resolves.toEqual({ userId: 'user-9' })
    await expect((unauthorizedResponse as any).json()).resolves.toEqual({ error: 'Unauthorized' })
    expect((unauthorizedResponse as any).status).toBe(401)
  })
})
