# AWS Deployment Guide

This project can run on one AWS EC2 instance with Docker Compose. The instance runs:

- Node.js app on port `8090`
- MongoDB container
- Redis container

This is a simple replicated deployment for testing/demo. For production, use managed services such as Amazon DocumentDB or MongoDB Atlas, ElastiCache for Redis, ECR, ECS, and a load balancer.

## Prerequisites

- AWS CLI installed and configured
- Docker installed locally
- GitHub repo pushed with the latest project code
- An AWS region selected, for example `ap-south-1`
- A key pair for SSH access

Check AWS login:

```bash
aws sts get-caller-identity
```

Set common variables:

```bash
export AWS_REGION=ap-south-1
export KEY_NAME=node-devops-key
export SG_NAME=node-devops-sg
export INSTANCE_NAME=node-devops-compose
export REPO_URL=https://github.com/YOUR_GITHUB_USER/containerized-node.js-app.git
```

## Update The Repo

Run these from the project folder:

```bash
npm test
docker compose config
git status --short
git add .
git commit -m "Add AWS deployment runbook"
git push
```

## Create EC2 Key Pair

Skip this if you already have a key pair.

```bash
aws ec2 create-key-pair \
  --region "$AWS_REGION" \
  --key-name "$KEY_NAME" \
  --query 'KeyMaterial' \
  --output text > "${KEY_NAME}.pem"

chmod 400 "${KEY_NAME}.pem"
```

## Create Security Group

Allow SSH from your current IP and app traffic on port `8090`.

```bash
export MY_IP=$(curl -s https://checkip.amazonaws.com)/32
export VPC_ID=$(aws ec2 describe-vpcs \
  --region "$AWS_REGION" \
  --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' \
  --output text)

export SG_ID=$(aws ec2 create-security-group \
  --region "$AWS_REGION" \
  --group-name "$SG_NAME" \
  --description "Node Docker Compose app" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' \
  --output text)

aws ec2 authorize-security-group-ingress \
  --region "$AWS_REGION" \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 22 \
  --cidr "$MY_IP"

aws ec2 authorize-security-group-ingress \
  --region "$AWS_REGION" \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 8090 \
  --cidr 0.0.0.0/0
```

Do not expose MongoDB `27017` or Redis `6379` publicly.

## Launch EC2

Prepare user data:

```bash
sed "s#https://github.com/YOUR_GITHUB_USER/containerized-node.js-app.git#$REPO_URL#g" scripts/aws-ec2-user-data.sh > /tmp/node-devops-user-data.sh
```

Get the latest Ubuntu 22.04 AMI ID:

```bash
export AMI_ID=$(aws ssm get-parameter \
  --region "$AWS_REGION" \
  --name /aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id \
  --query 'Parameter.Value' \
  --output text)
```

Launch the instance:

```bash
export INSTANCE_ID=$(aws ec2 run-instances \
  --region "$AWS_REGION" \
  --image-id "$AMI_ID" \
  --instance-type t3.micro \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --user-data file:///tmp/node-devops-user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
  --query 'Instances[0].InstanceId' \
  --output text)

aws ec2 wait instance-running \
  --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID"

export PUBLIC_IP=$(aws ec2 describe-instances \
  --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "App URL: http://$PUBLIC_IP:8090"
```

## Test On AWS

Give cloud-init a minute or two to finish, then run:

```bash
curl "http://$PUBLIC_IP:8090/"
curl "http://$PUBLIC_IP:8090/health"
```

Expected responses:

```json
{"source":"server","message":"Node DevOps Application Running"}
```

or after Redis has cached the value:

```json
{"source":"redis-cache","message":"Node DevOps Application Running"}
```

Health endpoint:

```json
{"status":"OK","mongodb":"connected","redis":"connected"}
```

## SSH And Operate The App

SSH into the instance:

```bash
ssh -i "${KEY_NAME}.pem" ubuntu@"$PUBLIC_IP"
```

Useful commands on the EC2 instance:

```bash
cd /opt/containerized-node.js-app
sudo docker compose ps
sudo docker compose logs -f app
sudo docker compose restart app
sudo docker compose down
sudo docker compose up -d --build
```

## Update AWS From Local Changes

Push local changes:

```bash
git add .
git commit -m "Update app"
git push
```

Pull and restart on EC2:

```bash
ssh -i "${KEY_NAME}.pem" ubuntu@"$PUBLIC_IP"
cd /opt/containerized-node.js-app
sudo git pull
sudo docker compose up -d --build
sudo docker compose ps
curl http://localhost:8090/health
```

## Stop Or Delete AWS Resources

Stop the app but keep the instance:

```bash
ssh -i "${KEY_NAME}.pem" ubuntu@"$PUBLIC_IP" "cd /opt/containerized-node.js-app && sudo docker compose down"
```

Terminate the EC2 instance:

```bash
aws ec2 terminate-instances \
  --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID"
```

Delete the security group after the instance is terminated:

```bash
aws ec2 delete-security-group \
  --region "$AWS_REGION" \
  --group-id "$SG_ID"
```
