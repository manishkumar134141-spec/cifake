import { ModelSpecification } from '../types';

export const MODEL_REGISTRY: ModelSpecification[] = [
  // Required Local Detector (Layer 1)
  {
    id: 'resnet18',
    name: 'Modified ResNet18',
    provider: 'local',
    parameters: 11169345,
    input_resolution: '32 × 32 RGB',
    architecture: 'Adapted ResNet18 (3×3 CIFAR stem, 1 output logit)',
    description: 'Primary benchmark-calibrated detector yielding 97.77% peak validation accuracy on the CIFAKE dataset. Required engine.',
    type: 'detector',
    status: 'online'
  },

  // Recommended External Vision Review (Layer 2)
  {
    id: 'gemini:flash',
    name: 'Google Gemini Vision',
    provider: 'gemini',
    input_resolution: 'Multimodal Vision',
    architecture: 'Google Gemini 1.5 / 2.0 Flash Multimodal Vision',
    description: 'Recommended multimodal visual review engine. Free API tier available from Google AI Studio.',
    type: 'vision-review',
    status: 'configured'
  },
  {
    id: 'openai:gpt-4o',
    name: 'OpenAI GPT-4o Vision',
    provider: 'openai',
    input_resolution: 'Multimodal Vision',
    architecture: 'OpenAI GPT-4o Multimodal Vision',
    description: 'Secondary multimodal visual review engine via OpenAI Platform API.',
    type: 'vision-review',
    status: 'configured'
  }
];
