# Contributing to AI Media Studio

Thank you for your interest in contributing to AI Media Studio!

## Code of Conduct

Please maintain a welcoming, respectful, and harassment-free environment for everyone.

## Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/your-username/AI_Media_Studio.git
   cd AI_Media_Studio
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Database**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start Development Environment**:
   ```bash
   npm run dev
   ```

5. **Run Tests**:
   ```bash
   npm test
   ```

## Pull Request Guidelines

- Ensure all Vitest unit and Playwright E2E tests pass (`npm test`).
- Follow established code formatting and architecture boundaries.
- Provide a clear, descriptive title and summary of changes.
