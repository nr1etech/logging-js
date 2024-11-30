---
layout: 'standard'
category: 'Technology'
title: 'Logging'
---

# Logging Standard

This logging standard applies to all internally developed applications.

## Log Output

Log output should be in a JSON format.

_Why?_

- This format allows logs to easily be ingested by various tools.
- This format is human readable.
- JSON is ubiquitous and can easily be converted to other formats

## Log Levels

Log levels are numeric, not text. The following are the default log levels and their meaning

- `10 - trace` - Most fine-grained level of logging, usually capturing detailed information about the application's operation. It's typically used for troubleshooting specific issues and is often very verbose.
- `20 - debug` - Slightly less detailed than trace and is used for debugging the application. It helps in understanding the flow through the system and is particularly useful during development.
- `30 - info` - Indicates general operational information that highlights the progress of the application. It's useful for reporting regular operations, such as the successful completion of specific tasks.
- `40 - warn` - Warning messages are used to indicate potential issues or problems that aren't immediately critical but might require attention to prevent future errors.
- `50 - error` - This level logs error events that might still allow the application to continue running. It's used to report significant problems that need to be addressed, like a failure in a critical process.
- `60 - fatal` - Fatal log levels are used for severe error events that will presumably lead the application to abort. This indicates critical situations, often resulting in the premature termination of the application.
- `70 - panic` - This level is used to log events that cause the application to stop functioning altogether, usually requiring immediate action. It’s often associated with an unstable state of the application that cannot be recovered from without restarting or significant intervention.

_Why?_

- This allows easier searching, filtering and sorting than text. Numeric values allow the use of standard arithmetic operators like greater than, less than and between.
- Spacing numbers in increments of 10 allows custom log levels if required

## Default Log Levels

In production environments, the log level should generally be set to _warn_ unless troubleshooting is required in production.

_Why?_

- Excessive logging can impact performance
- Reducing logs reduces costs

## Fields

The following explain the fields that make up a log entry.

_Why?_

- Standard fields reduce the amount of effort required in consuming logs.
- Multiple fields prevent the need to do string interpolation, formatting and modifications that add additional compute cycles that should go to servicing workloads.

### Required Fields

The following fields are required in every log message.

- `level` - Log level of the message. This should be a numeric value indicating the severity or importance of the log message. See above.
- `msg` - Mess contents. This should contain the actual log message.
- `svc` - Service that produced the message. This should be a string indicating the name or identifier of the service.
- `name` - Name of the logger or component inside the service producing the log messages. In some logging frameworks, this is referred to as a _label_.
- `time` - Time the message was output as the number of milliseconds since epoch (midnight January 1, 1970, UTC).

### Optional Fields

The following fields are not required to be present in every log message.

- `err` - An error associated with the message. This should be an Error object and will be logged out as `{err: {type: '', message: '', stack: ''}}`
- `thread` - The name of the thread in which the log message was created.
- `pid` - The process ID in which the log message was created.
- `host` - Name of the host, server or container that generated the log message.
- `ip` - The IP address of the host, server or container that generated the log message.
- `cip` - The IP address of the client associated with the log message.
- `trace` - Distributed trace information in a nested structure that follows `{id: '', parent: '', flags: '', version: ''}`. If a trace is provided, the `id` field is required and all other fields are optional.
- `rid` - A unique identifier for the request associated with the log message.

### Additional Fields

Additional fields may be added to the log entry that are not specified above. Be aware the more you add, the more resources may be taken by logging tools. Please be thoughtful when adding additional fields and ensure they are concise, useful and avoid CPU heavy formatting and additional objects placed upon the heap in whatever language you are using.
