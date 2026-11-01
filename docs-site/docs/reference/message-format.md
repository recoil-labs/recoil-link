---
title: Message format
---

# Message format

Every message is a packed byte string. The Mailbox builds it in `dispatch`; recipients only see the parsed fields in `handle`.

| Offset | Bytes | Field         | Notes                                     |
| ------ | ----- | ------------- | ----------------------------------------- |
| 0      | 1     | `version`     | `3`                                       |
| 1      | 4     | `nonce`       | Per-origin-Mailbox counter, starting at 0 |
| 5      | 4     | `origin`      | Origin domain id                          |
| 9      | 32    | `sender`      | Sending contract, left-padded to 32 bytes |
| 41     | 4     | `destination` | Destination domain id                     |
| 45     | 32    | `recipient`   | Recipient, left-padded to 32 bytes        |
| 77     | any   | `body`        | Your bytes                                |

The **message id** is `keccak256(message)`.

The format is identical to Hyperlane's version 3, and messages can be decoded with the CLI:

```bash
rlink message decode --bytes 0x03…
```
