pipeline {
    agent any
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
        stage('Deploy') {
            agent {
                docker {
                    // image 'node:22.14.0'
                    image 'my-docker-image'
                    reuseNode true
                }
            }
            environment {
                NETLIFY_AUTH_TOKEN = credentials('netlify-auth-token')
                NETLIFY_SITE_ID = credentials('netlify-site-id')
            }
            steps {
                sh '''
                    # npm install netlify-cli
                    # node_modules/.bin/netlify --version
                    # node_modules/.bin/netlify status
                    # node_modules/.bin/netlify deploy --dir=build --prod

                    netlify --version
                    echo "Site Id: $NETLIFY_SITE_ID"
                    netlify status
                    netlify deploy --dir=build --prod
                '''
            }
        }
    }
}