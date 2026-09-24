/**
 * Payment Provider Registry
 * Central registry for all payment providers
 */

import { IPaymentProvider, PaymentProviderType } from '../types'
import { InTouchProvider } from './intouch.provider'
import { IremboPayProvider } from './irembopay.provider'

/**
 * Provider factory - returns the appropriate provider instance
 */
export class PaymentProviderFactory {
  private static providers: Map<PaymentProviderType, IPaymentProvider> = new Map()

  /**
   * Get a payment provider instance
   */
  static getProvider(type: PaymentProviderType): IPaymentProvider {
    // Return cached instance if exists
    if (this.providers.has(type)) {
      return this.providers.get(type)!
    }

    // Create new instance
    let provider: IPaymentProvider

    switch (type) {
      case PaymentProviderType.INTOUCH:
        provider = new InTouchProvider()
        break

      case PaymentProviderType.IREMBO_PAY:
        provider = new IremboPayProvider()
        break

      // Future providers:
      // case PaymentProviderType.MTN_DIRECT:
      //   provider = new MTNDirectProvider()
      //   break
      // case PaymentProviderType.AIRTEL_DIRECT:
      //   provider = new AirtelDirectProvider()
      //   break

      default:
        throw new Error(`Payment provider ${type} not implemented`)
    }

    // Cache and return
    this.providers.set(type, provider)
    return provider
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): PaymentProviderType[] {
    return [
      PaymentProviderType.INTOUCH,
      PaymentProviderType.IREMBO_PAY,
      // Add more as they're implemented
    ]
  }

  /**
   * Check if a provider is available
   */
  static isProviderAvailable(type: PaymentProviderType): boolean {
    return this.getAvailableProviders().includes(type)
  }
}

export { InTouchProvider, IremboPayProvider }
