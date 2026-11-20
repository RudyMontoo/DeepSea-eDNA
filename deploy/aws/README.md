# Basic AWS deployment (EC2 + CloudFront)

One EC2 instance runs the same `docker compose` stack as local development
(PostgreSQL, Redis, MLflow, FastAPI, nginx frontend). Two CloudFront distributions
provide free HTTPS URLs, one for the app and one for the API, which Google sign-in
requires. The instance accepts traffic only from CloudFront; MLflow is reachable
only through a Session Manager tunnel. Everything is one CloudFormation stack.

```text
browser ──HTTPS──> CloudFront (app) ──HTTP:3000──┐
        ──HTTPS──> CloudFront (API) ──HTTP:8000──┴─> EC2 (Elastic IP): docker compose
                                                     postgres · redis · mlflow · backend · frontend
```

Approximate cost in ap-southeast-2: t3.small about $19/month, plus the public IPv4
address (~$3.60) and 30 GB gp3 disk (~$3). CloudFront is free at low traffic.

## 1. Store the secrets in SSM Parameter Store

```bash
export AWS_REGION=ap-southeast-2 P=/deepsea-edna
aws ssm put-parameter --name $P/SECRET_KEY --type SecureString --value "$(python -c 'import secrets;print(secrets.token_urlsafe(48))')"
aws ssm put-parameter --name $P/POSTGRES_PASSWORD --type SecureString --value "$(python -c 'import secrets;print(secrets.token_hex(16))')"
aws ssm put-parameter --name $P/ADMIN_EMAILS --type String --value you@example.com
# optional OAuth
aws ssm put-parameter --name $P/GOOGLE_CLIENT_ID --type String --value <client-id>
aws ssm put-parameter --name $P/GOOGLE_CLIENT_SECRET --type SecureString --value <client-secret>
```

## 2. Deploy

```bash
VPC=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query "Vpcs[0].VpcId" --output text)
SUBNET=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC Name=default-for-az,Values=true --query "Subnets[0].SubnetId" --output text)
PL=$(aws ec2 describe-managed-prefix-lists --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing --query "PrefixLists[0].PrefixListId" --output text)

aws cloudformation create-stack --stack-name deepsea-edna \
  --template-body file://deploy/aws/ec2-stack.yml --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=VpcId,ParameterValue=$VPC ParameterKey=SubnetId,ParameterValue=$SUBNET \
               ParameterKey=CloudFrontPrefixListId,ParameterValue=$PL
aws cloudformation wait stack-create-complete --stack-name deepsea-edna   # ~20-30 min
aws cloudformation describe-stacks --stack-name deepsea-edna --query "Stacks[0].Outputs" --output table
```

The stack completes only once the instance has built the images and both the API and
frontend report healthy. Then add the `GoogleRedirectUri` output to your Google OAuth
client's **Authorized redirect URIs**.

## Operate

```bash
# Shell on the instance (no SSH keys or open SSH port)
aws ssm start-session --target <InstanceId>
sudo tail -f /var/log/deepsea-bootstrap.log          # boot/build log
cd /opt/deepsea && sudo docker compose -f docker-compose.yml -f deploy/aws/docker-compose.aws.yml ps

# Update to the latest main
cd /opt/deepsea && sudo git pull && sudo docker compose -f docker-compose.yml -f deploy/aws/docker-compose.aws.yml up -d --build

# MLflow UI at http://localhost:5000 (needs the Session Manager plugin): see the MlflowTunnelCommand output
```

## Remove

```bash
aws cloudformation delete-stack --stack-name deepsea-edna
```

This deletes the instance **and its disk, including all accounts, history and MLflow data**.
SSM parameters are kept; delete them with `aws ssm delete-parameters`.
