
locals {
  name = "llm-edge"
}

## IAM Role: GreengrassV2TokenExchangeRole
resource "aws_iam_role" "greengrass_v2_token_exchange_role" {
  name = "GreengrassV2TokenExchangeRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "credentials.iot.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "greengrass_v2_token_exchange_role_access" {
  name        = "GreengrassV2TokenExchangeRoleAccess"
  description = "Policy for Greengrass V2 Token Exchange Role"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "s3:GetBucketLocation",
          "s3:GetObject",
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "greengrass_v2_token_exchange_role_policy_attachment" {
  role       = aws_iam_role.greengrass_v2_token_exchange_role.name
  policy_arn = aws_iam_policy.greengrass_v2_token_exchange_role_access.arn
}

## Create IoT Role Alias: GreengrassCoreTokenExchangeRoleAlias
resource "aws_iot_role_alias" "greengrass_core_token_exchange_role_alias" {
  alias               = "GreengrassCoreTokenExchangeRoleAlias"
  role_arn            = aws_iam_role.greengrass_v2_token_exchange_role.arn
  credential_duration = 3600
}

## IoT Thing
resource "aws_iot_thing" "edge_llm_core" {
  name = "${local.name}-core"
}

## IoT CreateKeysAndCertificate
resource "aws_iot_certificate" "edge_llm_core_cert" {
  active = true
}

## Attach thing principle - certificate
resource "aws_iot_thing_principal_attachment" "edge_llm_core_cert_attachment" {
  principal = aws_iot_certificate.edge_llm_core_cert.arn
  thing     = aws_iot_thing.edge_llm_core.name
}

## EdgeLLmCoreGroup
resource "aws_iot_thing_group" "edge_llm_core_group" {
  name = "${local.name}-core-group"
}

## Attach thing to group
resource "aws_iot_thing_group_membership" "edge_llm_core_group_membership" {
  thing_name       = aws_iot_thing.edge_llm_core.name
  thing_group_name = aws_iot_thing_group.edge_llm_core_group.name
}

## Create IoT Policy: GreengrassTESCertificatePolicyGreengrassCoreTokenExchangeRoleAlias
resource "aws_iot_policy" "greengrass_tes_certificate_policy" {
  name = "GreengrassTESCertificatePolicyGreengrassCoreTokenExchangeRoleAlias"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = {
      Effect   = "Allow",
      Action   = "iot:AssumeRoleWithCertificate",
      Resource = aws_iot_role_alias.greengrass_core_token_exchange_role_alias.arn
    }
  })
}

## Create IoT Policy: GreengrassV2IoTThingPolicy
resource "aws_iot_policy" "greengrass_v2_iot_thing_policy" {
  name = "GreengrassV2IoTThingPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive",
          "greengrass:*"
        ],
        Resource = "*"
      }
    ]
  })
}

## Attach policies to certificate
resource "aws_iot_policy_attachment" "tes_policy_attachment" {
  policy = aws_iot_policy.greengrass_tes_certificate_policy.name
  target = aws_iot_certificate.edge_llm_core_cert.arn
}

resource "aws_iot_policy_attachment" "iot_thing_policy_attachment" {
  policy = aws_iot_policy.greengrass_v2_iot_thing_policy.name
  target = aws_iot_certificate.edge_llm_core_cert.arn
}

## Create S3 bucket: greengrass-components-<region>-<account-id>
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "greengrass_components_bucket" {
  bucket = "greengrass-components-${data.aws_region.current.name}-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_ownership_controls" "greengrass_components_bucket_ownership" {
  bucket = aws_s3_bucket.greengrass_components_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}
