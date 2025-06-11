# riz-mAIstro Task Server CDK

Infrastructure as Code for deploying the riz-mAIstro Task MCP Server on AWS using the Cloud Development Kit (CDK).

## Overview

This repository contains AWS CDK infrastructure code for deploying a Model Context Protocol (MCP) server that integrates with the riz-mAIstro task management system. The MCP server enables AI assistants to interact with task management functionality through a standardized protocol.

## What is riz-mAIstro?

riz-mAIstro is an AI-powered task management agent that combines natural language processing with long-term memory to create an intuitive and adaptive task management experience. This CDK project provides the infrastructure foundation for deploying the MCP server component.

## What is Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open standard that enables developers to build secure, two-way connections between their data sources and AI-powered tools. MCP provides a standardized way to connect AI models to external systems, similar to how USB-C provides a universal connection standard for devices.

## Prerequisites

Before getting started, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) (`npm install -g aws-cdk`)
- An AWS account with appropriate permissions

## Dependencies

This CDK project depends on the actual task server implementation that needs to be cloned separately:

**Required:** Clone the [riz-mAIstro Task Server](https://github.com/anthony-ism/riz-mAIstro-task-server) repository into a `task-server` folder in the same parent directory as this CDK project. The deployment files are referenced from `../task-server`.

### Directory Structure
Your directory structure should look like this:
```
parent-directory/
├── riz-mAIstro-task-server-cdk/    # This CDK project
└── task-server/                     # The cloned task server repo
```

## Quick Start

### 1. Set Up Dependencies

First, ensure you have the required task server dependency:

```bash
# Navigate to your parent directory
cd /path/to/your/projects

# Clone this CDK repository (if not already done)
git clone https://github.com/anthony-ism/riz-mAIstro-task-server-cdk.git

# Clone the required task server dependency
git clone https://github.com/anthony-ism/riz-mAIstro-task-server.git task-server

# Navigate to the CDK project
cd riz-mAIstro-task-server-cdk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Bootstrap CDK (First-time setup only)

If this is your first time using CDK in your AWS account/region, you'll need to bootstrap:

```bash
npx cdk bootstrap
```

### 4. Build the Project

```bash
npm run build
```

### 5. Deploy the Infrastructure

```bash
npx cdk deploy
```

## Available Scripts

- `npm install` - Install project dependencies (must be run first)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile automatically
- `npm run test` - Run Jest unit tests
- `npx cdk deploy` - Deploy the stack to your AWS account/region
- `npx cdk diff` - Compare deployed stack with current state
- `npx cdk synth` - Generate and display the CloudFormation template
- `npx cdk destroy` - Remove the deployed infrastructure

## Project Structure

```
├── bin/                    # CDK app entry point
├── lib/                    # CDK construct definitions
├── test/                   # Unit tests
├── cdk.json               # CDK configuration
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Configuration

The `cdk.json` file contains configuration for the CDK Toolkit and specifies how to execute the application. You can modify this file to customize the deployment behavior.

## Development Workflow

1. **Make Changes**: Modify the CDK constructs in the `lib/` directory
2. **Build**: Run `npm run build` to compile TypeScript
3. **Test**: Run `npm run test` to execute unit tests
4. **Preview**: Use `npx cdk diff` to see what changes will be deployed
5. **Deploy**: Run `npx cdk deploy` to apply changes to AWS

## Related Projects

- [riz-mAIstro Task Server](https://github.com/anthony-ism/riz-mAIstro-task-server) - **Required dependency** - The MCP server implementation that this CDK project deploys
- [Task mAIstro](https://github.com/langchain-ai/task_mAIstro) - The main AI-powered task management agent
- [Model Context Protocol](https://github.com/modelcontextprotocol) - Official MCP repositories
- [AWS CDK](https://github.com/aws/aws-cdk) - AWS Cloud Development Kit