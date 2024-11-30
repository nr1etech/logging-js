# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.6.0

### Added

- Logging standard for reference

### Changed

- Changed requestId to rid to match standard and reduce volume
- Moved context methods from log entry to logger to avoid confusion
- Removed name from the context to avoid duplication with how pino works

### Fixed

- Fixed bug preventing child loggers from being created properly

## v1.5.0

### Added

- Added support to override timestamp format
- Added support to override timestamp label
- Added support to override log level format
- Added optional requestId to log message

### Changed

- Changed Level to be named LogLevel to avoid confusion when imported
- Dependencies updated including the version of pino
