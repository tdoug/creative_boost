# Creative Automation Pipeline - Project Context

## Project Overview

This is a proof-of-concept **Creative Automation Pipeline** for generating scalable social ad campaigns. The system automates creative asset generation using GenAI to help marketing teams rapidly produce localized campaign variations while maintaining brand consistency.

**Tech Stack**: TypeScript/JavaScript, React
**Runtime**: Node.js backend + React frontend (runs locally via CLI or web UI)

## Business Context

### Client Scenario
A global consumer goods company launching hundreds of localized social ad campaigns monthly.

### Business Goals
1. **Accelerate campaign velocity** - Rapidly ideate, produce, approve, and launch more campaigns
2. **Ensure brand consistency** - Maintain global brand guidelines across all markets and languages
3. **Maximize relevance & personalization** - Adapt messaging for local cultures and preferences
4. **Optimize marketing ROI** - Improve performance (CTR, conversions) vs. cost efficiency
5. **Gain actionable insights** - Track effectiveness and learn what drives outcomes

### Pain Points Being Solved
- Manual content creation overload (slow, expensive, error-prone)
- Inconsistent quality & messaging across regions
- Slow approval cycles with multiple stakeholders
- Difficulty analyzing performance at scale
- Resource drain on creative teams

## Technical Requirements

### Core Features (Minimum Viable)

#### Input Handling
- Accept **campaign brief** in JSON/YAML format containing:
  - Product(s) - at least **2 different products**
  - Target region/market
  - Target audience
  - Campaign message
- Accept **input assets** from local folder or storage
- Reuse existing assets when available

#### Asset Generation
- Generate new assets using **GenAI image models** when missing
- Produce creatives for **at least 3 aspect ratios** (e.g., 1:1, 9:16, 16:9)
- Display **campaign message** on final posts (English minimum, localized is bonus)

#### Output Management
- Save generated outputs to organized folder structure:
  - Organize by product and aspect ratio
  - Clear naming conventions
- Support cloud-agnostic storage (local filesystem, or abstract for AWS/Azure/Dropbox)

#### React Web UI
- **Campaign Brief Builder** - Interactive form to create/edit campaign briefs
  - Product configuration (add multiple products)
  - Target audience and region selectors
  - Campaign message input with preview
  - Asset upload/selection interface
- **Generation Dashboard** - Real-time progress tracking
  - Live progress indicators during asset generation
  - Preview generated assets as they complete
  - Error handling and retry options
- **Asset Gallery** - Visual browsing of generated campaigns
  - Grid view of all generated assets
  - Filter by product, aspect ratio, campaign
  - Download individual assets or entire campaigns
  - Side-by-side comparison view
- **Configuration Panel** - Cloud provider and settings management
  - Select cloud provider (AWS/Azure/GCP/Local)
  - Configure generation parameters
  - View usage metrics and costs

### Optional Enhancements (Bonus Features)
- **Brand compliance checks** - Verify logo presence, brand colors
- **Legal content checks** - Flag prohibited words
- **Logging/reporting** - Track generation results and metrics
- **UI Enhancements** - Dark mode, responsive design, keyboard shortcuts

## Architecture Considerations

### Cloud Provider Selection
The cloud provider choice determines which AI/ML platform and storage are used:

- **AWS**: Amazon Bedrock (Claude, Stable Diffusion, Titan Image Generator) + S3 Storage
- **Azure**: Azure OpenAI Service (DALL-E 3, GPT-4 Vision) + Azure Blob Storage
- **GCP**: Vertex AI (Imagen, Gemini Vision) + Cloud Storage

**Pattern**: Use adapter/strategy pattern with a common interface to abstract cloud provider AI services.

**Note**: Local filesystem storage is supported for POC/development only.

### GenAI Integration via Cloud Providers
- **Do NOT call OpenAI or Anthropic APIs directly**
- Use cloud-managed AI services for all LLM and image generation needs
- Benefits: Enterprise security, compliance, cost management, regional deployment
- Abstract API calls behind a service layer for easy provider switching

### Image Processing
- Generate multiple aspect ratios from base images
- Support resizing and cropping strategies
- Overlay text (campaign messages) on images
- Consider libraries: Sharp, Jimp, Canvas

### Data Flow
1. Parse campaign brief (JSON/YAML)
2. Check for existing assets in storage
3. Generate missing assets via GenAI
4. Process images (resize, format, add text)
5. Apply brand/legal checks (if implemented)
6. Save organized outputs
7. Generate summary report

## Project Structure (Recommended)

```
creative_boost/
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── core/
│   │   │   ├── campaign.ts          # Campaign brief types and validation
│   │   │   ├── pipeline.ts          # Main pipeline orchestration
│   │   │   └── asset-processor.ts  # Image processing logic
│   │   ├── services/
│   │   │   ├── cloud/
│   │   │   │   ├── cloud-provider.ts       # Abstract cloud provider interface
│   │   │   │   ├── aws/
│   │   │   │   │   ├── bedrock.ts          # AWS Bedrock image/text generation
│   │   │   │   │   ├── s3.ts               # AWS S3 storage
│   │   │   │   │   └── index.ts
│   │   │   │   ├── azure/
│   │   │   │   │   ├── openai.ts           # Azure OpenAI image/text generation
│   │   │   │   │   ├── blob-storage.ts     # Azure Blob Storage
│   │   │   │   │   └── index.ts
│   │   │   │   ├── gcp/
│   │   │   │   │   ├── vertex-ai.ts        # GCP Vertex AI image/text generation
│   │   │   │   │   ├── cloud-storage.ts    # GCP Cloud Storage
│   │   │   │   │   └── index.ts
│   │   │   │   ├── local/
│   │   │   │   │   ├── filesystem.ts       # Local storage for dev
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   └── compliance/
│   │   │       ├── brand-checker.ts
│   │   │       └── content-checker.ts
│   │   ├── api/
│   │   │   ├── server.ts            # Express/Fastify API server
│   │   │   ├── routes/
│   │   │   │   ├── campaigns.ts     # Campaign CRUD endpoints
│   │   │   │   ├── generation.ts    # Asset generation endpoints
│   │   │   │   └── assets.ts        # Asset serving endpoints
│   │   │   └── middleware/
│   │   │       ├── error-handler.ts
│   │   │       └── validation.ts
│   │   ├── utils/
│   │   │   ├── image-utils.ts       # Resizing, cropping, text overlay
│   │   │   ├── logger.ts            # Logging utility
│   │   │   └── config.ts            # Configuration management
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript types
│   │   └── cli.ts                   # CLI entry point
│   ├── input/
│   │   ├── briefs/                  # Example campaign briefs
│   │   └── assets/                  # Input assets library
│   ├── output/                      # Generated campaign assets
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BriefBuilder/
│   │   │   │   ├── BriefForm.tsx
│   │   │   │   ├── ProductConfig.tsx
│   │   │   │   └── AssetUploader.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── GenerationProgress.tsx
│   │   │   │   ├── ProgressIndicator.tsx
│   │   │   │   └── ErrorDisplay.tsx
│   │   │   ├── Gallery/
│   │   │   │   ├── AssetGrid.tsx
│   │   │   │   ├── AssetCard.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   └── ComparisonView.tsx
│   │   │   └── Settings/
│   │   │       ├── ConfigPanel.tsx
│   │   │       └── ProviderSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useCampaign.ts
│   │   │   ├── useGeneration.ts
│   │   │   └── useAssets.ts
│   │   ├── services/
│   │   │   └── api.ts               # Backend API client
│   │   ├── types/
│   │   │   └── index.ts             # Frontend types
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts               # Vite bundler config
│   └── index.html
├── config/
│   └── default.json             # Configuration file
├── README.md
├── CLAUDE.md                    # This file
└── .env.example                 # Environment variables template
```

## Key Types/Interfaces

```typescript
interface CampaignBrief {
  campaignId: string;
  products: Product[];
  targetRegion: string;
  targetAudience: string;
  message: string;
  locale?: string;
  brandGuidelines?: BrandGuidelines;
}

interface Product {
  id: string;
  name: string;
  description: string;
  existingAssets?: string[];  // Paths to existing assets
}

interface AspectRatio {
  width: number;
  height: number;
  label: string;  // e.g., "1:1", "9:16", "16:9"
}

interface GeneratedAsset {
  productId: string;
  aspectRatio: string;
  path: string;
  metadata: AssetMetadata;
}

interface CloudProvider {
  readonly name: 'aws' | 'azure' | 'gcp' | 'local';
  readonly region: string;

  // AI/ML capabilities
  generateImage(prompt: string, options: ImageOptions): Promise<Buffer>;
  generateText(prompt: string, options: TextOptions): Promise<string>;
  analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string>;

  // Storage capabilities
  upload(file: Buffer, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}

// Specific implementations
interface AWSProvider extends CloudProvider {
  readonly name: 'aws';
  readonly bedrock: BedrockClient;
  readonly s3: S3Client;
}

interface AzureProvider extends CloudProvider {
  readonly name: 'azure';
  readonly openai: OpenAIClient;
  readonly blobService: BlobServiceClient;
}

interface GCPProvider extends CloudProvider {
  readonly name: 'gcp';
  readonly vertexAI: VertexAI;
  readonly storage: Storage;
}
```

## Configuration Strategy

Use environment variables for sensitive data and provider selection:

```bash
# Cloud Provider (determines AI/ML platform AND storage)
CLOUD_PROVIDER=aws|azure|gcp
CLOUD_REGION=us-east-1  # or eastus, us-central1

# AWS Configuration (Bedrock + S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=campaign-assets
BEDROCK_MODEL_ID=stability.stable-diffusion-xl-v1  # or amazon.titan-image-generator-v1
BEDROCK_LLM_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Azure Configuration (OpenAI + Blob Storage)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_DEPLOYMENT_NAME=dall-e-3
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_STORAGE_ACCOUNT=creativeboost
AZURE_STORAGE_CONTAINER=campaign-assets

# GCP Configuration (Vertex AI + Cloud Storage)
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GCP_BUCKET=campaign-assets
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
VERTEX_AI_MODEL=imagegeneration@006  # Imagen 3

# Local Development Only
STORAGE_PATH=/path/to/local/storage  # For POC/dev without cloud

# Optional Features
ENABLE_BRAND_CHECK=true
ENABLE_LEGAL_CHECK=true
LOG_LEVEL=info
```

## Development Guidelines

### Code Quality
- Use TypeScript strict mode
- Implement proper error handling with custom error classes
- Write unit tests for core functionality
- Use async/await for asynchronous operations
- Follow SOLID principles for extensibility

### Performance Considerations
- Implement parallel asset generation where possible
- Cache GenAI responses to avoid duplicate API calls
- Use streaming for large file operations
- Implement retry logic for external API calls

### Security
- Never commit API keys or secrets
- Validate all input files and campaign briefs
- Sanitize text before overlay to prevent injection
- Implement rate limiting for GenAI API calls

## Testing Strategy

1. **Unit Tests** - Core logic, utilities, validators
2. **Integration Tests** - Storage providers, GenAI providers
3. **E2E Tests** - Full pipeline with sample briefs
4. **Manual Testing** - Visual verification of generated assets

## Documentation Requirements

The README should include:
1. **Setup instructions** - Dependencies, environment setup
2. **How to run** - CLI commands with examples
3. **Example input/output** - Sample brief and generated assets
4. **Key design decisions** - Architecture choices and rationale
5. **Assumptions & limitations** - Known constraints and trade-offs
6. **Configuration guide** - Environment variables and options
7. **Troubleshooting** - Common issues and solutions

## Deliverables Checklist

### Backend
- [ ] Working TypeScript/JavaScript implementation
- [ ] Support for at least 2 products per campaign
- [ ] Generation for at least 3 aspect ratios
- [ ] Campaign message overlay on images
- [ ] Cloud-agnostic storage abstraction
- [ ] GenAI integration for missing assets
- [ ] Organized output folder structure
- [ ] REST API for frontend integration
- [ ] WebSocket/SSE for real-time progress updates

### Frontend (React UI)
- [ ] Campaign Brief Builder with form validation
- [ ] Real-time Generation Dashboard with progress tracking
- [ ] Asset Gallery with filtering and preview
- [ ] Configuration Panel for provider selection
- [ ] Responsive design (mobile-friendly)
- [ ] Error handling and user feedback
- [ ] Download functionality for assets

### Documentation & Demo
- [ ] Comprehensive README
- [ ] Example campaign briefs
- [ ] Sample generated outputs
- [ ] 2-3 minute demo video (showing both CLI and UI)
- [ ] Public GitHub repository

## Example Usage

### CLI Mode

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run with sample brief
npm start -- --brief ./input/briefs/summer-campaign.json

# Run with options (AWS Bedrock)
npm start -- --brief ./input/briefs/summer-campaign.json \
  --output ./output \
  --ratios 1:1,9:16,16:9 \
  --cloud-provider aws

# Run with Azure OpenAI
npm start -- --brief ./input/briefs/summer-campaign.json \
  --cloud-provider azure

# Run with GCP Vertex AI
npm start -- --brief ./input/briefs/summer-campaign.json \
  --cloud-provider gcp
```

### Web UI Mode

```bash
# Install all dependencies
npm run install:all

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start backend and frontend in development mode
npm run dev

# OR start separately:

# Terminal 1 - Start backend API server
cd backend
npm run dev

# Terminal 2 - Start React frontend
cd frontend
npm run dev

# Access the UI at http://localhost:5173 (default Vite port)
```

## Notes for Claude

When assisting with this project:
1. **Focus on extensibility** - Design for easy addition of new providers
2. **Prioritize cloud agnosticism** - Keep storage/GenAI implementations pluggable
3. **Consider the demo** - Code should be easy to demo in 2-3 minutes
4. **Think about the interview** - Code will be reviewed, so prioritize clarity
5. **Balance scope** - This is a 2-3 hour exercise, don't over-engineer
6. **Document decisions** - Explain architectural choices in code comments
7. **Handle errors gracefully** - Make debugging easy for interviewers

## Useful Libraries

### Backend
- **Image Processing**: `sharp` (fast, production-ready)
- **Text Overlay**: `canvas` or `sharp` with custom text rendering
- **CLI**: `commander` or `yargs`
- **API Server**: `express` or `fastify`
- **Real-time Updates**: `ws` (WebSocket) or Server-Sent Events
- **Config**: `dotenv`, `config`
- **AWS AI/ML**: `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-bedrock`
- **Azure AI**: `@azure/openai`, `@azure/ai-vision-image-analysis`
- **GCP AI**: `@google-cloud/aiplatform`, `@google-cloud/vertexai`
- **Storage**: `@aws-sdk/client-s3`, `@azure/storage-blob`, `@google-cloud/storage`
- **Validation**: `zod` or `joi`
- **Testing**: `jest`, `vitest`
- **Logging**: `winston` or `pino`
- **CORS**: `cors` (for API)

### Frontend (React)
- **Build Tool**: `vite` (fast, modern bundler)
- **UI Framework**: `react`, `react-dom`
- **Routing**: `react-router-dom`
- **State Management**: `zustand` or `react-query`/`@tanstack/react-query`
- **Forms**: `react-hook-form` + `zod` for validation
- **UI Components**: `@headlessui/react`, `@radix-ui/react-*`, or `shadcn/ui`
- **Styling**: `tailwindcss` or `styled-components`
- **File Upload**: `react-dropzone`
- **Icons**: `lucide-react` or `react-icons`
- **Notifications**: `react-hot-toast` or `sonner`
- **HTTP Client**: `axios` or native `fetch`
- **Testing**: `vitest`, `@testing-library/react`

## Common Pitfalls to Avoid

1. Don't hardcode cloud provider specifics in core logic
2. Don't commit `.env` files or API keys
3. Don't skip input validation (briefs could be malformed)
4. Don't ignore error cases in AI generation/storage operations
5. Don't forget to handle rate limits and API quotas
6. Don't mix storage providers (if using AWS Bedrock, use S3; if Azure, use Blob, etc.)
7. Don't over-complicate for a POC (2-3 hours!)

## Questions to Consider

- How to handle partial failures (some assets generate, others fail)?
- Should we cache generated images to avoid regenerating?
- How to handle rate limits from cloud AI providers?
- What's the fallback if AI generation fails?
- How to validate brand guidelines programmatically?
- Should we support batch processing of multiple briefs?
- Which cloud provider offers the best model for product images?
- How to handle multi-region deployments for data residency?

## Cloud Provider Selection Guide

### When to Choose AWS Bedrock
✅ Already using AWS infrastructure
✅ Need access to Claude for text generation and brand compliance
✅ Want Stable Diffusion XL for photorealistic product images
✅ Prefer pay-per-use pricing with no upfront commitment
✅ Need enterprise-grade security and compliance

**Recommended Models**:
- Image: `stability.stable-diffusion-xl-v1` or `amazon.titan-image-generator-v1`
- Text: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### When to Choose Azure OpenAI
✅ Already using Azure/Microsoft ecosystem
✅ Need DALL-E 3 for creative, stylized images
✅ Want tight integration with Azure services
✅ Need enterprise SLAs and support
✅ Compliance with Microsoft's responsible AI framework

**Recommended Models**:
- Image: DALL-E 3 (`dall-e-3`)
- Text: GPT-4 Vision for image analysis

### When to Choose GCP Vertex AI
✅ Already using Google Cloud Platform
✅ Need Imagen 3 for high-quality, balanced images
✅ Want Gemini for multimodal capabilities
✅ Prefer Google's ML tooling and infrastructure
✅ Need global scale with low latency

**Recommended Models**:
- Image: Imagen 3 (`imagegeneration@006`)
- Text: Gemini 1.5 Pro for content and vision tasks

## Implementation Priority

### Phase 1: Core Backend (2-3 hours)
1. Set up basic CLI with campaign brief parsing
2. Implement one cloud provider (recommend AWS Bedrock for simplicity)
3. Generate images for 3 aspect ratios
4. Overlay campaign text on images
5. Save to organized output folders
6. Create REST API with Express/Fastify

### Phase 2: React UI (2-3 hours)
1. Set up React project with Vite
2. Create Campaign Brief Builder form
3. Implement Generation Dashboard with progress tracking
4. Build Asset Gallery with grid view
5. Add Configuration Panel for cloud provider selection
6. Connect to backend API

### Phase 3: Multi-Cloud Support (if time permits)
1. Abstract AI service layer
2. Add Azure OpenAI provider
3. Add GCP Vertex AI provider
4. Allow provider selection via UI and CLI flag

### Phase 4: Enhancements (bonus)
1. Brand compliance checks using LLM
2. Legal content validation
3. Caching layer for generated assets
4. Performance metrics and logging
5. Real-time progress updates via WebSocket/SSE
6. Dark mode and responsive design improvements

## Important Reminders

⚠️ **DO NOT use OpenAI or Anthropic APIs directly** - Always go through cloud providers
⚠️ **Cloud provider determines storage** - AWS uses S3, Azure uses Blob, GCP uses Cloud Storage
⚠️ **Request model access early** - AWS Bedrock and Azure OpenAI require access approval
⚠️ **Consider costs** - Image generation costs $0.02-0.12 per image depending on model
⚠️ **Implement rate limiting** - Cloud AI services have quotas (50-60 requests/minute)
⚠️ **Cache generated assets** - Avoid regenerating the same image multiple times
⚠️ **Handle errors gracefully** - AI services can timeout or rate limit
