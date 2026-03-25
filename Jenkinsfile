pipeline {
    agent any

    environment {
        AWS_REGION = 'ca-central-1'          // change to your region
        S3_BUCKET  = 'dh-react-app-2026'  // change to your bucket name
    }

    stages {
        stage('Docker') {
            steps {
                sh '''
                    docker --version
                    docker build -t my-docker-image .
                '''
            }
        }
        stage('Build') {
            agent {
                docker {
                    image 'node:22.14.0'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    ls -la
                    node -v
                    npm -v
                    npm install
                    npm run build
                    ls -la
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
        stage('AWS') {
            agent {
                docker {
                    image 'amazon/aws-cli'
                    args  '--entrypoint=""'
                    reuseNode true
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-s3-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        aws s3 sync build/ s3://$S3_BUCKET \
                            --region $AWS_REGION \
                            --delete
                    '''
                }
            }
        }
    }
}