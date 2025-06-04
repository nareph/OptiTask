# Contributing to OptiTask

First off, thank you for considering contributing to OptiTask! We appreciate your time and effort. These guidelines will help you get started.

## How Can I Contribute?

*   **Reporting Bugs:** If you find a bug, please open an issue on GitHub. Include as much detail as possible: steps to reproduce, expected behavior, actual behavior, screenshots, and your environment (browser, OS).
*   **Suggesting Enhancements:** Have an idea for a new feature or an improvement to an existing one? Open an issue to discuss it.
*   **Pull Requests:** If you'd like to contribute code:
    1.  Fork the repository.
    2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name` or `fix/bug-description`).
    3.  Make your changes. Ensure your code follows the project's coding style (run linters/formatters if configured).
    4.  Write clear, concise commit messages.
    5.  Push your branch to your fork (`git push origin feature/your-feature-name`).
    6.  Open a Pull Request against the `main` (or `develop`) branch of the original repository.
    7.  Clearly describe your changes in the Pull Request. Link to any relevant issues.

## Development Setup

Please refer to the `README.md` for instructions on how to set up the development environment for both the frontend and backend.

## Coding Conventions

*   **Rust (Backend):** Follow standard Rust conventions and use `rustfmt` for formatting. Run `cargo clippy` for linting.
*   **TypeScript/Next.js (Frontend):** Follow common TypeScript and React best practices. Use ESLint and Prettier (if configured) for linting and formatting.
*   **Commit Messages:** We aim for [Conventional Commits](https://www.conventionalcommits.org/) format (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).

## Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  Increase the version numbers in any examples and the README.md to the new version that this Pull Request would represent. The Githu Actions workflow will automatically create a tag and release.
4.  You may merge the Pull Request in once you have the sign-off of one other developer, or if you do not have permission to do that, you may request the reviewer to merge it for you.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms. (You might want to add a `CODE_OF_CONDUCT.md` file, a common one is the [Contributor Covenant](https://www.contributor-covenant.org/)).

We look forward to your contributions!