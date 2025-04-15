provider "aws" {
  region = "us-east-1"
  assume_role {
    session_name = "llm-edge"
    role_arn     = "arn:aws:iam::747340109238:role/terraform-apply"
  }
}