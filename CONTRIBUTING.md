# Contributing to ICCI FREE

First off, thank you for considering contributing to ICCI FREE! 🔥

It's people like you that make ICCI FREE such a great platform for free speech and streaming.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards others
- Accept constructive criticism gracefully

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When you are creating a bug report, please include:**
- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and OS information
- Console errors (if any)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**When creating an enhancement suggestion, please include:**
- A clear and descriptive title
- Detailed description of the proposed feature
- Why this enhancement would be useful
- Possible implementation approach (optional)

### Code Contributions

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (see commit guidelines)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

---

## 🛠️ Development Setup

### Prerequisites

- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Node.js 18+ (optional, for dev tools)
- Git
- Code editor (VS Code recommended)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/iccifree.git
   cd iccifree-complete
   ```

2. **Install dependencies (optional)**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Create a Supabase project
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

4. **Start development server**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node
   npx serve
   
   # VS Code Live Server
   # Click "Go Live" button
   ```

5. **Open in browser**
   ```
   http://localhost:8000
   ```

### Project Structure

```
iccifree-complete/
├── index.html              # Homepage
├── dashboard.html          # Dashboard
├── auth.html              # Authentication
├── golive.html            # Go Live interface
├── css/                   # Stylesheets
├── js/                    # JavaScript modules
├── images/                # Assets
└── docs/                  # Documentation
```

---

## 💻 Coding Standards

### JavaScript

```javascript
// ✅ Good
const userStream = async (userId) => {
    try {
        const stream = await getStream(userId);
        return stream;
    } catch (error) {
        console.error('Stream error:', error);
        throw error;
    }
};

// ❌ Bad
function getUserStream(userId) {
    return getStream(userId);
}
```

**Guidelines:**
- Use `const` and `let`, avoid `var`
- Use arrow functions for callbacks
- Always handle errors with try/catch
- Add comments for complex logic
- Use meaningful variable names
- Keep functions small and focused

### CSS

```css
/* ✅ Good */
.button-primary {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    padding: 12px 24px;
    border-radius: 8px;
}

/* ❌ Bad */
.btn1 {
    background: gold;
    padding: 12px 24px;
}
```

**Guidelines:**
- Use kebab-case for class names
- Follow BEM methodology when appropriate
- Mobile-first responsive design
- Use CSS variables for theming
- Avoid !important unless absolutely necessary

### HTML

```html
<!-- ✅ Good -->
<button class="primary-btn" aria-label="Start streaming">
    Go Live
</button>

<!-- ❌ Bad -->
<div onclick="goLive()">Go Live</div>
```

**Guidelines:**
- Semantic HTML elements
- Proper accessibility attributes
- Self-closing tags for void elements
- Consistent indentation (2 spaces)

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(webrtc): add automatic reconnection"

# Bug fix
git commit -m "fix(auth): resolve OAuth redirect issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Performance
git commit -m "perf(images): implement lazy loading"

# With body
git commit -m "feat(chat): add emoji support

- Added emoji picker component
- Updated chat input UI
- Added emoji shortcodes"
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] Tested on multiple browsers
- [ ] Mobile responsiveness verified

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tested thoroughly
```

### Review Process

1. PR submitted
2. Automated checks run (if configured)
3. Code review by maintainers
4. Feedback addressed
5. Approval and merge

---

## 🐛 Bug Reports

### Before Submitting

- Check existing issues
- Try to reproduce in latest version
- Collect all relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 11]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 2.0.0]

**Console Errors**
Any errors from browser console.

**Additional context**
Any other relevant information.
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, screenshots, or mockups.

**Would you like to work on this?**
- [ ] Yes, I can implement this
- [ ] No, just suggesting
```

---

## 🧪 Testing Guidelines

### Manual Testing

Test the following before submitting:

- [ ] **Auth Flow**
  - Login with Google
  - Login with Email
  - Logout
  - Session persistence

- [ ] **Streaming**
  - Start stream (broadcaster)
  - Watch stream (viewer)
  - Chat functionality
  - WebRTC connection stability

- [ ] **UI/UX**
  - Responsive on mobile
  - Touch interactions work
  - No layout shifts
  - Proper loading states

- [ ] **Performance**
  - Page load < 3s
  - No memory leaks
  - Smooth animations
  - No console errors

### Testing Commands

```javascript
// Run all tests
runTests()

// Specific tests
testWebRTC()
testPerformance()
testNetwork()

// Get reports
testReport()
downloadReport()
```

---

## 📚 Documentation

### What to Document

- New features and how to use them
- API changes
- Configuration options
- Breaking changes
- Migration guides

### Documentation Style

- Clear and concise
- Include code examples
- Add screenshots/GIFs when helpful
- Keep it updated with code changes

---

## 🏆 Recognition

Contributors will be:
- Listed in CHANGELOG
- Mentioned in release notes
- Added to contributors list
- Acknowledged on project website

---

## 🙋 Getting Help

If you need help:

1. Check the [Documentation](README.md)
2. Search [Existing Issues](https://github.com/yourusername/iccifree/issues)
3. Join our [Discord](https://discord.gg/iccifree)
4. Email: dev@iccifree.com

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

## 🎉 Thank You!

Your contributions make ICCI FREE better for everyone. We appreciate your time and effort! 🔥

---

<div align="center">
  <strong>Happy Contributing! 🚀</strong>
  <br>
  <sub>Built with 🔥 by the ICCI FREE community</sub>
</div>
