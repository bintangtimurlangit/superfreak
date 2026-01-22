declare module 'midtrans-client' {
  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string })
    createTransaction(parameter: any): Promise<{ token: string; redirect_url: string }>
    transaction: {
      notification(notification: any): Promise<any>
      status(orderId: string): Promise<any>
      cancel(orderId: string): Promise<any>
      refund(orderId: string, parameter: any): Promise<any>
    }
  }

  export class CoreApi {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string })
    charge(parameter: any): Promise<any>
    capture(parameter: any): Promise<any>
    cardRegister(parameter: any): Promise<any>
    cardToken(parameter: any): Promise<any>
    cardPointInquiry(tokenId: string): Promise<any>
  }

  const midtransClient: {
    Snap: typeof Snap
    CoreApi: typeof CoreApi
  }

  export default midtransClient
}
