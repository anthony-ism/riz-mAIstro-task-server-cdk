import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

import { execSync } from 'child_process';
import { Duration } from 'aws-cdk-lib';

export class TaskServerCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const taskTable = new dynamodb.Table(this, 'TaskTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add Bedrock permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'], // Scope down in production
    }));

    // Add DynamoDB permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [
        taskTable.tableArn,
      ],
    }));

  const taskMcpServerLambdaFunction = new lambda.Function(this, 'python-lambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('../task-server', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [],
          local: {
            tryBundle(outputDir: string) {
              try {
                execSync('(cd ../task-server ; source .venv/bin/activate)');
              } catch {
                return false;
              }

              const commands = [
                `(cd ../task-server`,
                `uv run pip3 install -r requirements.txt -t ${outputDir}`,
                `uv run pip3 install --platform manylinux2014_x86_64 --target=${outputDir} --implementation cp --python-version 3.12 --only-binary=:all: --upgrade fastapi>=0.115.12`,
                `cp -a . ${outputDir})`
              ];

              execSync(commands.join(' && '));
              return true;
            }
          }
        }
      }),
      memorySize: 1024,
      functionName: 'taskMcpServer',
      timeout: Duration.seconds(1)
  });
  

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'ApiGatewayRestApi', {
      restApiName: 'dev-mcp-server',
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
      deploy: true,
    });

    // API Gateway Resource
    const mcpResource = api.root.addResource('api');

    // API Gateway Method
    const integration = new apigateway.LambdaIntegration(taskMcpServerLambdaFunction, {
      proxy: true,
    });

    mcpResource.addMethod('ANY', integration, {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Manual deployment to match the original template structure
    const deployment = new apigateway.Deployment(this, 'ApiGatewayDeployment', {
      api: api,
    });

    const stage = new apigateway.Stage(this, 'DevStage', {
      deployment: deployment,
      stageName: 'dev',
    });

    // Outputs (equivalent to CloudFormation outputs)
    new cdk.CfnOutput(this, 'TaskMcpServerLambdaFunctionQualifiedArn', {
      value: taskMcpServerLambdaFunction.functionArn,
      description: 'Current Lambda function version',
      exportName: 'task-mcp-server-dev-TaskMcpServerLambdaFunctionQualifiedArn',
    });

    new cdk.CfnOutput(this, 'ServiceEndpoint', {
      value: `https://${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}/dev`,
      description: 'URL of the service endpoint',
      exportName: 'task-mcp-server-dev-ServiceEndpoint',
    });
  }
}
