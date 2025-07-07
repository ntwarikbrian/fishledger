# 📧 Email Configuration Setup Guide

This guide explains how to configure email functionality for the AquaManage messaging system.

## 🔧 Environment Variables Setup

The email system requires the following environment variables to be set:

### Required Variables

```bash
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Optional Variables (with defaults)

```bash
EMAIL_HOST=smtp.gmail.com          # Default: smtp.gmail.com
EMAIL_PORT=587                     # Default: 587
EMAIL_FROM=your_email@gmail.com    # Default: same as EMAIL_USER
```

## 🚀 Quick Setup

### Option 1: Using .env file (Recommended)

1. **Copy the sample environment file:**
   ```bash
   cp .env.sample .env
   ```

2. **Edit the .env file and set your email credentials:**
   ```bash
   # Email Configuration
   EMAIL_USER=automatedinventorymessage@gmail.com
   EMAIL_PASSWORD=wzge fkwj unyk xkiw
   EMAIL_FROM=automatedinventorymessage@gmail.com
   ```

3. **Save the file and restart your server**

### Option 2: Using System Environment Variables

Set the environment variables in your system:

**Windows (PowerShell):**
```powershell
$env:EMAIL_USER="automatedinventorymessage@gmail.com"
$env:EMAIL_PASSWORD="wzge fkwj unyk xkiw"
$env:EMAIL_FROM="automatedinventorymessage@gmail.com"
```

**Windows (Command Prompt):**
```cmd
set EMAIL_USER=automatedinventorymessage@gmail.com
set EMAIL_PASSWORD=wzge fkwj unyk xkiw
set EMAIL_FROM=automatedinventorymessage@gmail.com
```

**Linux/macOS:**
```bash
export EMAIL_USER="automatedinventorymessage@gmail.com"
export EMAIL_PASSWORD="wzge fkwj unyk xkiw"
export EMAIL_FROM="automatedinventorymessage@gmail.com"
```

## 🧪 Testing Email Configuration

After setting up the environment variables, test the email functionality:

```bash
cd server
npm run test:email
```

This will:
- ✅ Verify email configuration
- ✅ Test SMTP connection
- ✅ Send test emails

## 📧 Gmail App Password Setup

If you're using Gmail, you'll need an App Password:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Use the generated password** as your `EMAIL_PASSWORD`

## 🔒 Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables** for all sensitive data
3. **Use App Passwords** instead of your actual Gmail password
4. **Rotate credentials** regularly
5. **Limit access** to your .env file

## 🐛 Troubleshooting

### Common Issues

**"Email credentials not configured"**
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set
- Verify the .env file is in the correct location
- Restart the server after changing environment variables

**"Authentication failed"**
- Verify your Gmail App Password is correct
- Ensure 2-Factor Authentication is enabled on Gmail
- Check that the email address is correct

**"Connection timeout"**
- Check your internet connection
- Verify firewall settings allow SMTP connections
- Try using port 465 with SSL instead of 587 with TLS

### Debug Mode

Enable debug logging to see detailed email configuration:

```bash
LOG_LEVEL=debug npm run dev
```

## 📝 Example .env File

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_MODE=supabase
SUPABASE_URL=https://your-project.supabase.co
# ... other database settings

# Email Configuration (REQUIRED)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=automatedinventorymessage@gmail.com
EMAIL_PASSWORD=wzge fkwj unyk xkiw
EMAIL_FROM=automatedinventorymessage@gmail.com

# Other configurations...
```

## 🎯 Verification

Once configured, you should see this message when starting the server:

```
✅ Email configuration loaded from environment variables
📧 Email settings:
   Host: smtp.gmail.com
   Port: 587
   User: automatedinventorymessage@gmail.com
   From: automatedinventorymessage@gmail.com
```

## 📞 Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Run the email test script: `npm run test:email`
3. Verify your Gmail App Password is working
4. Check firewall and network settings
