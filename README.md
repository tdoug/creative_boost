# Creative Boost - AI-Powered Creative Automation Pipeline

An automated creative asset generation system for scalable social ad campaigns. Generate localized campaign variations using GenAI while maintaining brand consistency.

## Overview

This project automates the creation of social media ad creatives by:
- Accepting campaign briefs (product, audience, messaging)
- Generating missing assets using cloud AI services (AWS Bedrock, Azure OpenAI, GCP Vertex AI)
- Producing creatives for multiple aspect ratios (1:1, 9:16, 16:9)
- Overlaying campaign messages on images
- Organizing outputs in structured folders

**Tech Stack**: TypeScript, Node.js, React, Express, Vite

## Features

### Core Capabilities
- **Multi-Product Support** - Generate campaigns for multiple products simultaneously
- **Multi-Aspect Ratio** - Automatic generation for 1:1 (Instagram), 9:16 (Stories), and 16:9 (YouTube) formats
- **Cloud-Agnostic** - Support for AWS Bedrock, Azure OpenAI, and GCP Vertex AI
- **Text Overlay** - Campaign messages overlaid on generated images
- **Local & Cloud Storage** - Local filesystem or cloud storage (S3, Azure Blob, GCS)
- **Real-time Progress** - WebSocket-based progress updates during generation

### React Web UI
- **Campaign Brief Builder** - Interactive form to create campaigns
- **Generation Dashboard** - Real-time progress tracking with live previews
- **Asset Gallery** - Browse, filter, and download generated assets
- **Configuration Panel** - Manage cloud provider settings

### CLI Mode
- Run campaigns from command line with JSON/YAML briefs
- Batch processing support
- Flexible configuration via environment variables

## Prerequisites

- **Node.js** v18+ and npm
- **Cloud Provider Account** (choose one):
  - AWS account with Bedrock access (Stable Diffusion XL or Titan Image)
  - Azure account with OpenAI Service (DALL-E 3)
  - GCP account with Vertex AI (Imagen)
  - OR use local mode (no cloud provider required, mock generation)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd creative_boost

# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 2. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env and configure your cloud provider
# For local development/testing, default settings work out of the box
```

**Minimal .env for local testing:**
```bash
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_S3_BUCKET=local
STORAGE_PATH=./output
PORT=3000
```

**For AWS Bedrock (production):**
```bash
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name  # or 'local' for filesystem
BEDROCK_MODEL_ID=stability.stable-diffusion-xl-v1:0
BEDROCK_LLM_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 3. Run the Application

**Option A: Full Stack (Web UI + API)**
```bash
# Start both backend and frontend in development mode
npm run dev

# Access the UI at http://localhost:5173
# API runs at http://localhost:3000
```

**Option B: Backend Only (CLI Mode)**
```bash
# Run a campaign brief via CLI
npm run cli -- --brief backend/input/briefs/summer-campaign.json

# Or with options
npm run cli -- --brief backend/input/briefs/coffee-campaign.json --ratios 1:1,9:16 --output ./output
```

**Option C: Run Backend and Frontend Separately**
```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend UI
cd frontend
npm run dev
```

## Project Structure

```
creative_boost/
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── api/                 # Express API server
│   │   ├── cli.ts              # CLI entry point
│   │   ├── core/               # Campaign and pipeline logic
│   │   ├── services/           # Cloud providers, compliance
│   │   ├── utils/              # Image processing, logging
│   │   └── types/              # TypeScript types
│   ├── input/
│   │   ├── briefs/             # Example campaign briefs
│   │   └── assets/             # Input assets library
│   └── output/                 # Generated campaign assets
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── BriefBuilder/  # Campaign form
│   │   │   ├── Dashboard/     # Progress tracking
│   │   │   └── Gallery/       # Asset browsing
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript types
│   └── public/
├── .env                        # Environment configuration (gitignored)
├── .env.example               # Environment template
├── package.json               # Root package with scripts
└── README.md                  # This file
```

## Usage Guide

### Creating a Campaign Brief

Campaign briefs are JSON files that define your campaign:

```json
{
  "campaignId": "summer-2024",
  "products": [
    {
      "id": "sunscreen-spf50",
      "name": "Ultra Defense SPF 50",
      "description": "Premium sunscreen with advanced UV protection",
      "existingAssets": []
    },
    {
      "id": "after-sun-lotion",
      "name": "Soothing After-Sun Lotion",
      "description": "Hydrating after-sun care with aloe vera"
    }
  ],
  "targetRegion": "North America",
  "targetAudience": "Health-conscious adults 25-45",
  "message": "Stay Protected All Summer Long",
  "locale": "en-US"
}
```

Save this as `backend/input/briefs/my-campaign.json`

### Running via CLI

```bash
# Basic usage
npm run cli -- --brief backend/input/briefs/my-campaign.json

# Specify output directory
npm run cli -- --brief backend/input/briefs/my-campaign.json --output ./output/summer

# Generate specific aspect ratios only
npm run cli -- --brief backend/input/briefs/my-campaign.json --ratios 1:1,9:16

# Use specific cloud provider
npm run cli -- --brief backend/input/briefs/my-campaign.json --cloud-provider azure
```

### Using the Web UI

1. Start the development server: `npm run dev`
2. Open http://localhost:5173
3. **Build a Campaign**:
   - Fill out the campaign form (products, audience, message)
   - Upload existing assets (optional)
   - Click "Generate Campaign"
4. **Monitor Progress**:
   - Watch real-time generation progress
   - Preview assets as they're created
5. **Browse & Download**:
   - View all generated assets in the gallery
   - Filter by product or aspect ratio
   - Download individual assets or entire campaigns

### Output Structure

Generated assets are organized by campaign, product, and aspect ratio:

```
output/
└── summer-2024/
    ├── sunscreen-spf50/
    │   ├── 1x1/
    │   │   └── sunscreen-spf50-1x1.png
    │   ├── 9x16/
    │   │   └── sunscreen-spf50-9x16.png
    │   └── 16x9/
    │       └── sunscreen-spf50-16x9.png
    └── after-sun-lotion/
        ├── 1x1/
        ├── 9x16/
        └── 16x9/
```

## Cloud Provider Configuration

### AWS Bedrock

**Prerequisites:**
- AWS account with Bedrock access
- Model access enabled for Stable Diffusion XL (or Titan Image Generator)
- AWS credentials configured (`aws configure`)

**Environment:**
```bash
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=stability.stable-diffusion-xl-v1:0
BEDROCK_LLM_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_S3_BUCKET=your-bucket-name  # or 'local'
```

**Request Model Access:**
1. Go to AWS Console → Bedrock → Model access
2. Request access to Stable Diffusion XL and Claude models
3. Wait for approval (usually immediate for Claude, may take time for Stable Diffusion)

### Azure OpenAI

**Prerequisites:**
- Azure subscription
- Azure OpenAI Service resource created
- DALL-E 3 deployment

**Environment:**
```bash
CLOUD_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=dall-e-3
AZURE_STORAGE_CONTAINER=local  # or Azure Blob container name
```

### GCP Vertex AI

**Prerequisites:**
- GCP project with Vertex AI enabled
- Service account with Vertex AI permissions
- Imagen access enabled

**Environment:**
```bash
CLOUD_PROVIDER=gcp
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
VERTEX_AI_MODEL=imagegeneration@006
GCP_BUCKET=local  # or Cloud Storage bucket name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Local Development Mode

For testing without cloud services:

```bash
CLOUD_PROVIDER=aws
AWS_S3_BUCKET=local
STORAGE_PATH=./output
```

This uses local filesystem storage and mock image generation (placeholder images).

## Available Scripts

```bash
# Install all dependencies
npm run install:all

# Development mode (backend + frontend)
npm run dev

# Development with detailed logs
npm run watch

# Build for production
npm run build

# Run CLI
npm run cli -- --brief <path-to-brief.json>

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Testing
npm test                  # Run all tests (backend + frontend)
npm run test:backend      # Run backend tests (Jest)
npm run test:frontend     # Run frontend tests (Vitest)
npm run test:watch        # Run tests in watch mode

# Frontend test UI (optional)
cd frontend && npm run test:ui
```

## API Endpoints

The backend exposes the following REST API:

```
GET    /health                    # Health check
POST   /api/campaigns              # Create campaign
GET    /api/campaigns              # List campaigns
GET    /api/campaigns/:id          # Get campaign details
POST   /api/campaigns/:id/generate # Generate assets
GET    /api/assets/:campaignId     # List assets for campaign
GET    /api/assets/:campaignId/:filename # Download asset
```

**WebSocket** endpoint for real-time progress:
```
WS     /ws                        # Real-time generation updates
```

## Architecture Highlights

### Cloud Provider Abstraction

The system uses an adapter pattern to abstract cloud provider differences:

```typescript
interface CloudProvider {
  generateImage(prompt: string, options: ImageOptions): Promise<Buffer>;
  generateText(prompt: string, options: TextOptions): Promise<string>;
  upload(file: Buffer, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  // ...
}
```

Implementations:
- `AWSProvider` - AWS Bedrock + S3
- `AzureProvider` - Azure OpenAI + Blob Storage
- `GCPProvider` - Vertex AI + Cloud Storage
- `LocalProvider` - Filesystem + mock generation

### Image Processing

Uses Sharp.js for:
- Resizing images to multiple aspect ratios
- Text overlay with proper positioning
- Format conversion (PNG, JPEG)
- Quality optimization

### Real-time Updates

WebSocket connections provide live progress updates:
- Generation start/progress/complete events
- Error notifications
- Asset preview URLs as they're generated

## Troubleshooting

### AWS Bedrock "Model not found" error

**Solution**: Request model access in AWS Console → Bedrock → Model access

### "ENOENT: no such file or directory" error

**Solution**: Ensure output directories exist or use `mkdir -p output`

### Frontend can't connect to backend

**Solution**: Check that:
- Backend is running on port 3000 (or check `PORT` in .env)
- CORS is enabled (already configured)
- Frontend API client points to correct URL

### Image generation is slow

**Expected**: Each image takes 5-15 seconds to generate depending on cloud provider and model

### Rate limiting errors

**Solution**:
- Reduce concurrent requests
- Add delays between generation calls
- Check cloud provider quotas

## Cost Considerations

**Estimated costs per image:**
- AWS Bedrock (Stable Diffusion XL): ~$0.04 per image
- Azure OpenAI (DALL-E 3): ~$0.04-0.08 per image
- GCP Vertex AI (Imagen): ~$0.02-0.06 per image

**Local mode**: Free (uses mock generation)

## Development Roadmap

- [ ] Brand compliance checks (logo detection, color validation)
- [ ] Legal content validation (prohibited words)
- [ ] Performance analytics and reporting
- [ ] Batch campaign processing
- [ ] Template library
- [ ] A/B testing support
- [ ] Multi-language support
- [ ] Video creative generation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review CLAUDE.md for detailed project context

## Acknowledgments

Built with:
- TypeScript & Node.js
- React & Vite
- Express.js
- Sharp (image processing)
- AWS Bedrock / Azure OpenAI / GCP Vertex AI
- TailwindCSS
