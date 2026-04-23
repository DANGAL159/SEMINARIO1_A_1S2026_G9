# terraform/compute.tf

# ==========================================
# 1. PERMISOS PARA LAS EC2 (IAM Role)
# ==========================================
resource "aws_iam_role" "ec2_role" {
  name = "ec2_ai_role_g9"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_rekognition" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRekognitionFullAccess"
}
resource "aws_iam_role_policy_attachment" "ec2_translate" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/TranslateFullAccess"
}
resource "aws_iam_role_policy_attachment" "ec2_lex" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonLexRunBotsOnly"
}
resource "aws_iam_role_policy_attachment" "ec2_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "ec2_cognito" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2_ai_profile_g9"
  role = aws_iam_role.ec2_role.name
}

# ==========================================
# 2. APPLICATION LOAD BALANCER (ALB)
# ==========================================
resource "aws_lb" "app_alb" {
  name               = "semisocial-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]

  tags = { Name = "ALB-SemiSocial" }
}

resource "aws_lb_target_group" "app_tg" {
  name     = "semisocial-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main_vpc.id

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 10
  }
}

resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# ==========================================
# 3. INSTANCIAS EC2 (Clones NodeJS)
# ==========================================
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Máquina 1
resource "aws_instance" "backend_node_1" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_subnet_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
              apt-get install -y nodejs git
              npm install -g pm2
              EOF

  tags = { Name = "Backend-NodeJS-1" }
}

# Máquina 2 (Clon exacto)
resource "aws_instance" "backend_node_2" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_subnet_2.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
              apt-get install -y nodejs git
              npm install -g pm2
              EOF

  tags = { Name = "Backend-NodeJS-2" }
}

# Conectar al Balanceador
resource "aws_lb_target_group_attachment" "node1_attach" {
  target_group_arn = aws_lb_target_group.app_tg.arn
  target_id        = aws_instance.backend_node_1.id
  port             = 3000
}

resource "aws_lb_target_group_attachment" "node2_attach" {
  target_group_arn = aws_lb_target_group.app_tg.arn
  target_id        = aws_instance.backend_node_2.id
  port             = 3000
}

# Output
output "load_balancer_dns" {
  value = aws_lb.app_alb.dns_name
}