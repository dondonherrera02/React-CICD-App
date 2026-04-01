pipeline {
    agent any

    environment {
        AWS_REGION        = 'ca-central-1'
        ECR_REGISTRY      = '297601880443.dkr.ecr.ca-central-1.amazonaws.com'  // your AWS account ID, change task-definition.json accordingly
        ECR_REPO          = 'my-react-repo'       // your ECR repository name
        ECS_CLUSTER       = 'my-react-app-cluster-1111'         // your ECS cluster name
        ECS_SERVICE       = 'my-react-task-definition-service-rm4jz3w2'         // your ECS service name
        ECS_TASK_FAMILY   = 'my-react-task-definition'      // your task definition family name
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
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-s3-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        aws ecr get-login-password --region $AWS_REGION \
                            | docker login --username AWS \
                              --password-stdin $ECR_REGISTRY

                        docker build -t $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG .
                        docker push $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
                    '''
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-s3-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        # Update the image tag in task definition and register it
                        sed -i "s|nginx:1.27-alpine|$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG|g" \
                            aws/task-definition.json

                        aws ecs register-task-definition \
                            --region $AWS_REGION \
                            --cli-input-json file://aws/task-definition.json

                        # Get the latest revision just registered
                        TASK_REVISION=$(aws ecs describe-task-definition \
                            --region $AWS_REGION \
                            --task-definition $ECS_TASK_FAMILY \
                            --query 'taskDefinition.revision' \
                            --output text)

                        aws ecs update-service \
                            --region $AWS_REGION \
                            --cluster $ECS_CLUSTER \
                            --service $ECS_SERVICE \
                            --task-definition $ECS_TASK_FAMILY:$TASK_REVISION
                    '''
                }
            }
        }
    }
}