pipeline {
    agent any

    environment {
        AWS_REGION        = 'ca-central-1'
        ECR_REGISTRY      = '297601880443.dkr.ecr.ca-central-1.amazonaws.com'
        ECR_REPO          = 'my-react-repo'
        ECS_CLUSTER       = 'my-react-app-cluster-1111'
        ECS_SERVICE       = 'my-react-task-definition-service-rm4jz3w2'
        ECS_TASK_FAMILY   = 'my-react-task-definition'
        IMAGE_TAG         = "${BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            agent {
                docker {
                    image 'node:22.14.0'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    node -v
                    npm -v
                    npm install
                    npm run build
                '''
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:22.14.0'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    test -f build/index.html
                    npm test
                '''
            }
        }

        stage('Docker Build & Push to ECR') {
            agent {
                docker {
                    image 'amazon/aws-cli:latest'
                    reuseNode true
                    args '-u root --entrypoint="" -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-s3-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        # Install docker CLI inside aws-cli container
                        yum install -y docker

                        aws ecr get-login-password --region $AWS_REGION \
                            | docker login --username AWS \
                              --password-stdin $ECR_REGISTRY

                        docker build \
                            -t $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG \
                            -t $ECR_REGISTRY/$ECR_REPO:latest .

                        docker push $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
                        docker push $ECR_REGISTRY/$ECR_REPO:latest
                    '''
                }
            }
        }

        stage('Deploy to ECS') {
            agent {
                docker {
                    image 'amazon/aws-cli:latest'
                    reuseNode true
                    args '-u root --entrypoint=""'
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-s3-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        sed -i "s|IMAGE_PLACEHOLDER|$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG|g" \
                            aws/task-definition.json

                        aws ecs register-task-definition \
                            --region $AWS_REGION \
                            --cli-input-json file://aws/task-definition.json

                        TASK_REVISION=$(aws ecs describe-task-definition \
                            --region $AWS_REGION \
                            --task-definition $ECS_TASK_FAMILY \
                            --query 'taskDefinition.revision' \
                            --output text)

                        aws ecs update-service \
                            --region $AWS_REGION \
                            --cluster $ECS_CLUSTER \
                            --service $ECS_SERVICE \
                            --task-definition $ECS_TASK_FAMILY:$TASK_REVISION \
                            --force-new-deployment
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Image $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG deployed to ECS."
        }
        failure {
            echo "Pipeline failed. Check the logs above for details."
        }
    }
}