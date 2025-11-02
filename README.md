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
- **Text Overlay** - Campaign messages overlaid on generated images without the hassle of poor AI imagegen text output
- **Local & Cloud Storage** - Local filesystem or cloud storage (S3, Azure Blob, GCS)
- **Real-time Progress** - WebSocket-based progress updates during generation

### React Web UI
- **Campaign Brief Builder** - Interactive form to create campaigns with brand asset support (logos, colors)
- **AI-Powered Message Enhancement** - Automatically optimize messages for target demographics
- **Generation Dashboard** - Real-time progress tracking with live previews and PDF report generation
- **Asset Gallery** - Browse, filter, and download generated assets
- **Brand Compliance Checking** - AI-powered verification that generated images include brand logos and colors
- **Campaign Management** - Save, load, and manage multiple campaigns
- **Persistent Storage** - All generated assets are saved and viewable across sessions

### CLI Mode
- **Headless Generation** - Run campaign generation without the web UI
- **Brief Validation** - Validate campaign briefs before generation
- **JSON Summary Output** - Detailed generation reports saved to file
- **Batch Processing** - Integrate into automation workflows
- **Cost Optimization** - No frontend overhead, minimal resource usage
- **CI/CD Integration** - Automate campaign generation in pipelines
- **Scheduled Generation** - Use cron/task schedulers for bulk processing

#### Cost & Scaling Benefits
The CLI mode provides significant advantages for production workflows:

**💰 Reduced Infrastructure Costs**
- No web server required - runs as a simple script
- Minimal memory footprint (~50MB vs ~200MB+ for full stack)
- Can run on cheaper compute instances (t3.micro vs t3.medium)
- **Estimated savings**: 60-70% on compute costs for batch workloads

**⚡ Faster Iteration & Development**
- Quick validation of campaign briefs without UI overhead
- Rapid testing of cloud provider configurations
- Instant feedback on brief errors before committing resources
- **Time savings**: Validate 100 briefs in <1 minute vs manual UI testing

**📈 Production Scalability**
- Parallel processing: Run multiple CLI instances simultaneously
- Container-friendly: Perfect for Kubernetes batch jobs or AWS Batch
- Serverless compatible: Package as Lambda/Cloud Functions for event-driven generation
- Queue integration: Process campaigns from SQS/Pub-Sub/RabbitMQ

**🔄 Automation Workflows**
```bash
# Example: Scheduled bulk generation
0 2 * * * cd /app && npm run cli generate -- -b /data/daily-campaigns/*.json

# Example: CI/CD pipeline step
- name: Generate Campaign Assets
  run: npm run cli generate -- -b campaign-brief.json -o ./artifacts

# Example: Event-driven processing
aws sqs receive-message --queue-url $QUEUE | \
  jq -r '.brief' | \
  npm run cli generate -- -b /dev/stdin
```

## Prerequisites

- **Node.js** v18+ and npm
- **Cloud Provider Account** (choose one):
  - AWS account with Bedrock access (Stable Diffusion XL or Titan Image)
  - Azure account with OpenAI Service (DALL-E 3)
  - GCP account with Vertex AI (Imagen)

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

# Edit .env and configure your cloud provider.  Your local provider must be configured to work in your local environment
# e.g. - For AWS, the `aws` command must work in your terminal.
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
AWS_S3_BUCKET=your-bucket-name  # or leave empty for local filesystem
BEDROCK_MODEL_ID=amazon.nova-canvas-v1:0  # Recommended: Nova Canvas
BEDROCK_LLM_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 3. Run the Application

**Option A: Web UI Mode (Recommended)**
```bash
# Start both backend and frontend in development mode
npm run dev

# Access the UI at http://localhost:5173
# API runs at http://localhost:3000
```

**Option B: Development with "Watch" Enabled**
```bash
# Start with hot refresh of both backend and frontend
npm run watch

# Access the UI at http://localhost:5173
# API runs at http://localhost:3000
```

**Option C: CLI Mode (Headless)**
```bash
# Generate campaign from a brief file
npm run cli generate -- -b backend/input/briefs/summer-campaign.json

# Validate a campaign brief without generating
npm run cli validate -- -b backend/input/briefs/summer-campaign.json

# Generate with custom output directory
npm run cli generate -- -b backend/input/briefs/coffee-campaign.json -o ./custom-output
```

**Option D: Run Backend and Frontend Separately**
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
│   │   ├── api/                 # Express API server & routes
│   │   ├── cli.ts               # CLI entry point
│   │   ├── core/                # Campaign and pipeline logic
│   │   ├── services/            # Cloud providers, compliance
│   │   │   └── cloud/           # AWS, Azure, GCP providers
│   │   ├── utils/               # Image processing, logging, config
│   │   └── types/               # TypeScript types
│   ├── input/
│   │   ├── briefs/              # Example campaign briefs
│   │   └── assets/              # Input assets library
│   └── output/                  # Generated campaign assets
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── BriefBuilder/    # Campaign form
│   │   │   ├── Dashboard/       # Progress tracking
│   │   │   ├── Gallery/         # Asset browsing
│   │   │   └── Menu/            # Navigation
│   │   ├── services/            # API client
│   │   └── types/               # TypeScript types
│   └── public/
├── .env                         # Environment configuration (gitignored)
├── .env.example                 # Environment template
├── package.json                 # Root package with scripts
└── README.md                    # This file
```

## Usage Guide

### Using the CLI

The CLI provides a headless mode for campaign generation, ideal for automation, batch processing, and cost-effective production workflows.

#### Generate Campaign Assets

```bash
# Basic usage
npm run cli generate -- -b backend/input/briefs/summer-campaign.json

# With custom output directory
npm run cli generate -- -b backend/input/briefs/coffee-campaign.json -o ./my-output

# Using different example briefs
npm run cli generate -- -b backend/input/briefs/example-campaign.json
```

**Output:**
- Creates organized asset folders: `output/{campaignId}/{productId}/{aspectRatio}.png`
- Generates a summary JSON: `output/{campaignId}/summary.json`
- Shows real-time progress in the terminal
- Exit code 0 on success, 1 on failure

#### Validate a Campaign Brief

```bash
# Validate brief structure without generating assets
npm run cli validate -- -b backend/input/briefs/summer-campaign.json
```

**Output:**
- Checks JSON structure and required fields
- Validates product definitions
- Exit code 0 if valid, 1 if invalid

#### CLI Command Reference

```
Commands:
  generate    Generate campaign assets from a brief
  validate    Validate a campaign brief without generating

Options:
  -b, --brief <path>    Path to campaign brief JSON file (required)
  -o, --output <path>   Output directory (default: ./output)
  -h, --help            Display help
  -V, --version         Display version
```

#### Production Use Cases

**1. Batch Campaign Generation**
```bash
# Process multiple campaigns overnight
for brief in /data/campaigns/*.json; do
  npm run cli generate -- -b "$brief" -o "/output/$(basename $brief .json)"
done
```

**2. Brief Validation in CI/CD**
```bash
# Validate all briefs before deployment
find ./campaigns -name "*.json" -exec \
  npm run cli validate -- -b {} \; || exit 1
```

**3. Scheduled Bulk Processing**
```bash
# Crontab: Generate campaigns daily at 2 AM
0 2 * * * cd /app && ./scripts/generate-daily-campaigns.sh
```

**4. Container-Based Scaling**
```yaml
# Kubernetes CronJob example
apiVersion: batch/v1
kind: CronJob
metadata:
  name: campaign-generator
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: generator
            image: creative-boost:latest
            command: ["npm", "run", "cli", "generate"]
            args: ["-b", "/data/brief.json"]
```

**5. AWS Batch Integration**
```bash
# Process campaigns from S3 via AWS Batch
aws batch submit-job \
  --job-name campaign-gen-${CAMPAIGN_ID} \
  --job-definition creative-boost-cli \
  --container-overrides 'command=["npm","run","cli","generate","-b","s3://briefs/campaign.json"]'
```

### Using the Web UI

1. **Start the Application**:
   ```bash
   npm run dev
   ```

2. **Open the Web UI**: Navigate to http://localhost:5173

3. **Build a Campaign**:
   - Enter a Campaign ID (e.g., "summer-2024")
   - Add products with names and descriptions
   - Select target region and audience
   - Enter your campaign message (or use AI enhancement)
   - Click "Generate Campaign"

4. **Monitor Progress**:
   - Watch real-time generation progress in the dashboard
   - See live previews as assets are created
   - Track success/error status for each asset

5. **Browse & Download**:
   - View all generated assets in the gallery below
   - Assets persist across sessions
   - Download individual images directly from the gallery
   - Download a comprehensive PDF campaign report with all settings and generated images

6. **Brand Compliance Checking** (if brand assets are configured):
   - Click "Check Brand Compliance" on any generated image
   - AI analyzes the image to verify:
     - Brand logo presence (if logo was uploaded)
     - Brand color usage (if colors were specified)
   - Receive instant feedback on compliance status

7. **Manage Campaigns**:
   - Use the hamburger menu (☰) to save campaigns
   - Load previously saved campaigns
   - Reuse campaign configurations

## Cloud Provider Configuration

### AWS Bedrock

**Prerequisites:**
- AWS account with Bedrock access
- Model access enabled for Amazon Nova Canvas (or Titan Image Generator v2)
- AWS credentials configured (`aws configure`)

**Environment:**
```bash
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-canvas-v1:0  # Recommended
# Alternative: amazon.titan-image-generator-v2:0
BEDROCK_LLM_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_S3_BUCKET=your-bucket-name  # or leave empty for local storage
```

**Available Image Models:**
- `amazon.nova-canvas-v1:0` - **Recommended** - Best for artistic styles and creative assets
- `amazon.titan-image-generator-v2:0` - Good for product photography

**Available LLM Models**
- `us.anthropic.claude-3-5-sonnet-20241022-v2:0` - On-demand throughput version of Claude Sonnet 3.5

**Request Model Access:**
1. Go to AWS Console → Bedrock → Model access
2. Request access to Amazon Nova Canvas and Claude models (if necessary)
3. Wait for approval (usually immediate for on-demand models)

### Azure OpenAI (UNTESTED)

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
AZURE_STORAGE_CONTAINER=campaign-assets  # or leave empty for local storage
```

### GCP Vertex AI (UNTESTED)

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
GCP_BUCKET=campaign-assets  # or leave empty for local storage
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Local Development Mode

For testing without cloud services:

```bash
CLOUD_PROVIDER=aws
AWS_S3_BUCKET=  # Leave empty for local filesystem
STORAGE_PATH=./output
```

### Analytics Configuration (Optional)

Track user behavior and campaign performance:

```bash
# Google Analytics 4
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Hotjar for user session recording
HOTJAR_SITE_ID=1234567
```

**Note**: Analytics are optional. Leave these values blank to disable tracking.

## Additional Available Scripts

```bash
# Install all dependencies
npm run install:all

# Development mode (backend + frontend)
npm run dev

# Development with detailed logs
npm run watch

# Build for production
npm run build

# CLI mode
npm run cli generate -- -b <path-to-brief.json>
npm run cli validate -- -b <path-to-brief.json>

# Backend only (API server)
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## Testing
```bash
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
GET    /health                         # Health check
POST   /api/campaigns/generate          # Generate campaign assets
POST   /api/campaigns/validate          # Validate campaign brief
POST   /api/campaigns/enhance-prompt    # AI-enhance campaign message
GET    /api/assets                      # List all assets
GET    /api/assets/:campaignId          # List assets for specific campaign
GET    /api/assets/file/*               # Download/serve asset file
POST   /api/compliance/check            # Check brand compliance of an asset
```

**WebSocket** endpoint for real-time progress:
```
WS     /ws?campaignId=<id>              # Real-time generation updates
```

**Example API Usage:**
```bash
# Validate a campaign brief
curl -X POST http://localhost:3000/api/campaigns/validate \
  -H "Content-Type: application/json" \
  -d @backend/input/briefs/summer-campaign.json

# Enhance a campaign message
curl -X POST http://localhost:3000/api/campaigns/enhance-prompt \
  -H "Content-Type: application/json" \
  -d '{"message": "Stay cool this summer", "targetRegion": "North America", "targetAudience": "Adults 25-45"}'

# Generate campaign assets
curl -X POST http://localhost:3000/api/campaigns/generate \
  -H "Content-Type: application/json" \
  -d @backend/input/briefs/summer-campaign.json

# Check brand compliance of an asset
curl -X POST http://localhost:3000/api/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "campaign-123/product-1/1:1_1234567890.png",
    "brandAssets": {
      "logo": "logos/campaign-123-logo.png",
      "primaryColor": "#FF5733",
      "secondaryColor": "#33FF57"
    }
  }'
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

### AI Generation Costs
**Estimated costs per image (as of 2024):**
- AWS Bedrock (Nova Canvas): ~$0.04 per image (on-demand)
- AWS Bedrock (Titan Image v2): ~$0.008 per image (512x512)
- Azure OpenAI (DALL-E 3): ~$0.04-0.08 per image
- GCP Vertex AI (Imagen 3): ~$0.02-0.06 per image

**Note**: Prices vary by region and usage tier. Check your cloud provider's pricing page for current rates.

### Infrastructure Costs

**Web UI Mode (Full Stack)**
- EC2 t3.medium or equivalent: ~$30/month
- Load balancer: ~$20/month
- **Total**: ~$50/month for always-on service

**CLI Mode (Batch Processing)**
- EC2 t3.micro (scheduled): ~$5/month (4 hours/day)
- AWS Batch (on-demand): Pay only during generation
- Lambda/Cloud Functions: $0.20 per million requests
- **Total**: ~$5-10/month for scheduled batch jobs

**Cost Optimization Example:**
```
Campaign: 100 products × 3 aspect ratios = 300 images
Generation time: ~15 minutes
Frequency: Daily

Web UI (always-on): $50/month
CLI (scheduled):    $8/month (t3.micro, 15 min/day)

Savings: 84% ($504/year)
```

### Scalability ROI

**Scenario: Scaling from 10 to 1,000 campaigns/month**

| Approach | Infrastructure | Cost/Month | Scaling Complexity |
|----------|---------------|------------|-------------------|
| Web UI Manual | t3.large + team time | $200 + labor | High - requires manual effort |
| Web UI Automated | t3.large 24/7 | $70 | Medium - needs always-on server |
| CLI + AWS Batch | On-demand compute | $15 | Low - auto-scales |
| CLI + Lambda | Serverless | $8 | Minimal - fully managed |

**Recommended Approach:**
- **Development/Testing**: Web UI for interactive campaign building
- **Production/Scale**: CLI mode for automated, cost-effective generation

## Development Roadmap

- [x] Brand compliance checks (logo detection, color validation) - **Completed**
- [x] PDF campaign report generation - **Completed**
- [x] Multi-language support (English, Hindi, Mandarin) - **Completed**
- [X] Legal content validation (prohibited words)
- [ ] Performance analytics and reporting
- [ ] Batch campaign processing
- [ ] Template library
- [ ] A/B testing support
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
