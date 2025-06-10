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

    // Lambda Functions for MCP Servers
    const taskMcpServerLambdaFunction = new lambda.Function(this, 'TaskMcpServerLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset('../task-server'),
      role: lambdaRole,
      environment: {
        TASK_TABLE_NAME: taskTable.tableName,
      },
    });
  

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'ApiGatewayRestApi', {
      restApiName: 'task-mcp-server',
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
      deploy: true,
    });

    // API Gateway Resource
    const mcpResource = api.root.addResource('mcp');

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
