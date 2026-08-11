# Django Chatbot Website

A simple chatbot website built with Django. This chatbot can respond to basic queries using a rule-based approach.

## Features

- Interactive chat interface
- Real-time responses using AJAX
- Message history tracking
- Mobile-responsive design
- Admin interface for message management

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd chatbot_project
   ```

2. Install dependencies:
   ```
   pip install django
   ```

3. Apply migrations:
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Create a superuser (optional, for admin access):
   ```
   python manage.py createsuperuser
   ```

5. Run the development server:
   ```
   python manage.py runserver
   ```

6. Access the website at http://127.0.0.1:8000/

## Usage

1. Type a message in the chat input field and press Enter or click Send
2. The chatbot will respond based on the content of your message
3. Your conversation history is saved and displayed below the chat interface

## Admin Interface

Access the admin interface at http://127.0.0.1:8000/admin/ to view and manage chat messages.

## Customization

### Adding New Responses

To add new responses to the chatbot, edit the `get_bot_response` function in `chatbot/views.py`.

### Styling

The CSS styles are located in `chatbot/static/chatbot/css/style.css`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.