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
    description: 'Primary benchmark-calibrated detector yielding 97.77% peak validation accuracy on the CIFAKE dataset. The only required detector engine.',
    type: 'detector',
    status: 'online'
  },

  // Required External Vision Review (Layer 2)
  {
    id: 'gemini:flash',
    name: 'Google Gemini Vision',
    provider: 'gemini',
    input_resolution: 'Multimodal Vision',
    architecture: 'Google Gemini 1.5 / 2.0 Flash Multimodal Vision',
    description: 'Required multimodal visual review engine. Free API tier available from Google AI Studio (https://aistudio.google.com/app/apikey).',
    type: 'vision-review',
    status: 'configured'
  }
];
