// AI Provider Factory
export * from './types';
export { OpenAIProvider } from './openai-provider';
export { ReplicateProvider } from './replicate-provider';
export { StabilityProvider } from './stability-provider';
export { FalProvider } from './fal-provider';

import { OpenAIProvider } from './openai-provider';
import { ReplicateProvider } from './replicate-provider';
import { StabilityProvider } from './stability-provider';
import { FalProvider } from './fal-provider';
import type { AIProvider, ProviderName } from './types';

// Provider instances
const providers: Record<ProviderName, AIProvider> = {
  openai: new OpenAIProvider(),
  replicate: new ReplicateProvider(),
  stability: new StabilityProvider(),
  fal: new FalProvider(),
};

/**
 * Get a provider by name
 */
export function getProvider(name: ProviderName): AIProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return provider;
}

/**
 * Get all available providers
 */
export function getAllProviders(): AIProvider[] {
  return Object.values(providers);
}

/**
 * Check if a provider name is valid
 */
export function isValidProvider(name: string): name is ProviderName {
  return name in providers;
}
