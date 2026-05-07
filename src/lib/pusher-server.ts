let _pusher: any = null

function getPusherServer() {
  if (_pusher) return _pusher
  if (!process.env.PUSHER_APP_ID) return null
  const Pusher = require('pusher')
  _pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER || 'eu',
    useTLS: true,
  })
  return _pusher
}

export async function triggerEvent(channel: string, event: string, data: unknown): Promise<void> {
  const pusher = getPusherServer()
  if (!pusher) return
  try {
    await pusher.trigger(channel, event, data)
  } catch (err) {
    console.error('[Pusher] trigger error', err)
  }
}

export function kitchenChannel(businessId: string): string {
  return `private-kitchen-${businessId}`
}

export function orderChannel(orderId: string): string {
  return `private-order-${orderId}`
}
