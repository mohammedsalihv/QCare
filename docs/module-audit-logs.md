# Module audit logs

Each module page has its own audit-log link, with the same reusable search, filter, sort and pagination controls. System Activity History provides a combined view. Server API prefixes determine the module; the browser cannot label an operation as a different module. JAWDA types, QMS sections and equipment/privileges have separate scopes.

## Captured events

The shared middleware records API POST, PUT, PATCH and DELETE requests plus explicit report, evidence, certificate and export downloads. It records attempted operations, including denied and failed requests; successful POST requests may be previews rather than data changes. Routine GET list polling is omitted. Background scheduled jobs are outside request capture; their existing logs are unchanged.

New entries include UTC timestamp (displayed in UAE time), actor ID/name/employee ID/role when authenticated, module, HTTP method/path, server-generated request ID, affected record ID when returned or present in the path, result/status code, duration, connection IP, user agent, inferred browser/OS/device, submitted field names and file MIME/size metadata. Submitted fields describe the request, not a before/after change set. Incident report edits retain their existing before/after values and reasons in incident history, now with connection metadata and request ID for correlation.

Passwords, tokens, cookies, request bodies, response bodies, query values, file contents and filenames are not copied by the shared request logger. User agent strings are client-supplied hints, not verified device identity. IP defaults to the socket address. Explicitly configured trusted proxies may forward a single validated client address; the connecting peer is retained separately. No client geolocation or MAC address is inferred.

The log entry is created before business handlers run. If it cannot be written, the operation receives HTTP 503 without running the handler. Completion updates record success/failure/denial/interruption. A crash or finalization failure leaves a Pending entry, which means the final outcome is unknown, not success. No portal endpoint edits or deletes audit records. Database operators retain database-level access; this is not a tamper-proof external archive.

## Access and historical limits

Superadmin and Admin can view all module logs. Quality Manager can view quality/operational modules, but not people, authentication, credentials or administrative masters/settings. Other roles cannot view module audit logs. Backend scope checks apply independently of UI links.

The new module table contains only actual shared server-request events. Legacy controller logs remain in the database and the legacy authorized API. The old UI fallback that fabricated events on network failure, and automatic audit-log sample seeding, are removed. Existing incident workflow history stays accessible in Incident Management; missing historical IP/browser data is shown as not recorded.

Interface-only pages (currently including contacts, application roles, user assignments, password management and report generator) have module audit views but do not produce server events until their actions are connected to a backend. Opening a view or clicking a local mock button is not represented as a successful business change. Actual server calls are attributed by their API module. Authentication-less legacy handlers can only be attributed to an unknown actor unless they establish an authenticated request user.

## Verification

Isolated tests cover prefix coverage for all mounted business APIs, module role scope, connection IP spoof resistance, secrets excluded from logs, incident workflow metadata, successful and denied request capture, and blocking a mutation when initial audit persistence fails. No live business records need to be changed to test these controls.

Live verification on 8 November 2026: the existing Chrome portal, signed in as Quality Manager, downloaded an incident summary PDF. Its module audit view displayed the actual actor, connection IP, Chrome/Windows details and successful HTTP result. No live business record was edited or deleted. Backend backup: `/home/salih/QCare_deploy_backups/module-audit-20261108`; local Vite frontend updated, separate hosted frontend not published. Targeted lint passes (the existing DashboardLayout hook dependency warning is unchanged); production build passes with the existing bundle-size advisory.

## Original client IP behind NAT and proxies

The inspected connection reaches the server as `192.168.1.220`, while the client has Wi-Fi `172.16.50.59` and VPN/interface `10.212.134.202`. QCare cannot reconstruct an original private address after network address translation. The current localhost Vite proxy also calls backend port 5000 directly, bypassing nginx. The trusted-proxy support alone does not solve that network path.

Application support is deployed, but forwarding trust remains disabled until the proxy is configured securely. A server administrator must add these lines inside the existing nginx `/api/` location in `/etc/nginx/conf.d/qcare.conf` (not as a second duplicate location):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Overwrite inbound headers; do not pass through a caller-provided address or use an unchecked first entry. After backing up the configuration, validate with `sudo nginx -t`, then reload nginx. Only after that succeeds, run as the existing PM2 owner:

```sh
QCARE_AUDIT_TRUSTED_PROXIES=127.0.0.1,::1 pm2 restart QCare --update-env
pm2 save
```

Use the hosted portal through nginx for this path. Separately, the firewall/VPN administrator must preserve the client/VPN source IP on the QCare route, with suitable return routing. If an upstream HTTP proxy terminates requests, configure its authenticated/trusted forwarding chain explicitly rather than trusting the NAT gateway or all private addresses. A client-side browser cannot reliably disclose its LAN address, and browser-supplied IP claims must not be treated as verified audit identity.

Successful trusted forwarding records `ipSource=trusted-proxy`, the forwarded `ipAddress`, and the socket `peerIpAddress`. Otherwise the UI labels the address as a network source that may represent NAT. Existing events are not rewritten. Tests cover IPv4, IPv6, mapped IPv4, untrusted senders, invalid values and forged multi-hop headers. The deployment account cannot change nginx: it is root-owned and `sudo -n` requires a password. Administrator/network configuration remains outstanding.
