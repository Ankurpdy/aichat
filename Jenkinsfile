pipeline {
    agent any

    environment {
        EC2_HOST    = '32.236.187.104'  // Replace with EC2 Public IP
        EC2_USER    = 'ubuntu'
        APP_DIR     = '/var/www/chatbot_project'
        SSH_CRED_ID = 'ec2-ssh-key'          // Must match Jenkins Credential ID
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Ankurpdy/aichat.git'
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install -r req.txt
                    python manage.py test
                '''
            }
        }

        stage('Package Project to ZIP') {
            steps {
                sh '''
                    zip -r chatbot_app.zip . -x "*.git*" "venv/*" "__pycache__/*" "*.zip"
                '''
            }
        }

        stage('Deploy ZIP to EC2 via SSH/SCP') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: SSH_CRED_ID, keyFileVariable: 'KEY_FILE', usernameVariable: 'KEY_USER')]) {
                    sh """
                        # Restrict private key permissions
                        chmod 600 \${KEY_FILE}

                        # Copy application archive to EC2 using temporary key file
                        scp -i \${KEY_FILE} -o StrictHostKeyChecking=no chatbot_app.zip ${EC2_USER}@${EC2_HOST}:/tmp/chatbot_app.zip

                        # Unpack archive and update services on EC2
                        ssh -i \${KEY_FILE} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '''
                            set -e

                            if ! command -v unzip &> /dev/null; then
                                sudo apt update && sudo apt install -y unzip
                            fi

                            unzip -o /tmp/chatbot_app.zip -d ${APP_DIR}
                            rm -f /tmp/chatbot_app.zip

                            cd ${APP_DIR}

                            if [ ! -d "venv" ]; then
                                python3 -m venv venv
                            fi

                            source venv/bin/activate
                            pip install --upgrade pip
                            pip install -r req.txt

                            python manage.py migrate --noinput
                            python manage.py collectstatic --noinput

                            sudo systemctl daemon-reload
                            sudo systemctl restart gunicorn
                            sudo systemctl restart nginx
                        '''
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}