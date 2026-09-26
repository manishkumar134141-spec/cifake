import { ModelSpecification } from '../types';

export const MODEL_REGISTRY: ModelSpecification[] = [
  // Local Detectors (Layer 1)
  {
    id: 'resnet18',
    name: 'Modified ResNet18',
    provider: 'local',
    parameters: 11169345,
    input_resolution: '32 × 32 RGB',
    architecture: 'Adapted ResNet18 (3×3 CIFAR stem, 1 output logit)',
    description: 'CIFAKE benchmark detector with 97.77% peak validation accuracy.',
    type: 'detector',
    status: 'online'
  },
  {
    id: 'paper_cnn',
    name: 'PaperCNN',
    provider: 'local',
    parameters: 141345,
    input_resolution: '32 × 32 RGB',
    architecture: '2-Stage ConvNet + FC (141,345 trainable parameters)',
    description: 'CIFAKE research paper baseline compact CNN with 95.68% validation accuracy.',
    type: 'detector',
    status: 'online'
  },

  // External Vision Review (Layer 2) — Single OpenAI Model
  {
    id: 'openai:gpt-4o',
    name: 'OpenAI Vision',
    provider: 'openai',
    input_resolution: 'Multimodal Vision',
    architecture: 'OpenAI Multimodal Vision Model',
    description: 'Secondary visual observation engine via OpenAI Responses API.',
    type: 'vision-review',
    status: 'configured'
  }
];
