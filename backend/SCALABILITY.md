# CV-Wiz Scalability Documentation

## Audit Log Retention Policy

### Overview
Audit logs are automatically cleaned up based on a configurable retention policy to prevent unbounded database table growth.

### Retention Period
- **Default**: 90 days
- **Minimum**: 30 days
- **Maximum**: 365 days

### Implementation
The `AuditLogRetentionService` provides automated cleanup:
- Location: `backend/app/services/audit_retention.py`
- Singleton: `get_audit_retention_service()`
- Method: `cleanup_old_logs()` - should be called daily via background job

### Usage Example
```python
from app.services.audit_retention import get_audit_retention_service

service = get_audit_retention_service(retention_days=90)
result = await service.cleanup_old_logs()
```

### Schema Considerations
The `AuditLog` model already includes indexes for optimal cleanup performance:
- `@@index([createdAt])` for efficient date-based queries
- Consider partitioning by date for very high volume

### Database Partitioning (Recommended for Production)
For high-volume deployments, implement table partitioning:
```sql
-- Example: Monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Resume Snapshot Size Limits

### Overview
Resume snapshots stored in `ResumeVersion` and `SharedResume` are validated and size-limited to prevent unbounded JSON storage growth.

### Size Limits
- **Maximum snapshot size**: 512 KB
- **Warning threshold**: 256 KB
- **Maximum array length**: 100 items per array

### Implementation
The `SnapshotStorageManager` enforces size limits:
- Location: `backend/app/services/snapshot_limits.py`
- Singleton: `get_snapshot_storage_manager()`
- Automatic validation before storage
- Compression to metadata-only when size exceeds thresholds

### Usage Example
```python
from app.services.snapshot_limits import get_snapshot_storage_manager

manager = get_snapshot_storage_manager()
snapshot, validation = manager.prepare_snapshot_for_storage(raw_snapshot)

if not validation["valid"]:
    # Handle oversized snapshot
    pass
```

### Compression Strategy
When snapshots exceed the warning threshold:
1. Arrays are truncated to most recent N items (default: 100)
2. For very large snapshots, compress to metadata-only (IDs + essential fields)
3. Full data can be reconstructed from live profile if needed

### Schema Considerations
Current schema stores snapshots as `Json` fields:
```prisma
model ResumeVersion {
  snapshot    Json     // Complete snapshot of profile data
}

model SharedResume {
  snapshot    Json?    // Optional snapshot
}
```

**Future Enhancement**: Consider moving large snapshots to object storage (S3) for very large profiles.

---

## CPU-Intensive Task Offloading

### Overview
FastAPI event loop blocking is prevented by offloading CPU-intensive operations to a thread pool.

### Implementation
**PDF Generation** (Already Implemented):
- Location: `backend/app/utils/pdf_generator.py`
- Thread pool: `get_pdf_executor()`
- Max workers: 4
- Offloads WeasyPrint rendering to prevent event loop blocking

**Usage Example**:
```python
from app.utils.pdf_generator import get_pdf_executor

# CPU-intensive task runs in thread pool
pdf_bytes = await loop.run_in_executor(
    get_pdf_executor(),
    self._generate_pdf_sync,
    html_content,
    max_pages
)
```

**File Upload Parsing** (Already Implemented):
- Location: `backend/app/routers/upload.py`
- Semaphore: Limits concurrent parsing to 3 operations
- Prevents memory exhaustion from multiple large uploads

### Monitoring
Add monitoring for:
- Thread pool queue depth
- Task execution time
- Semaphore wait time

---

## Streaming File Upload Processing

### Overview
Large file uploads are streamed to temporary files instead of being loaded entirely into memory.

### Implementation
**Location**: `backend/app/routers/upload.py`

**Key Features**:
1. **Streaming**: Files streamed in 8KB chunks to temp files
2. **Size validation**: During streaming (not after)
3. **Concurrency control**: Semaphore limits concurrent parses
4. **Cleanup**: Temp files deleted after processing

**Code Flow**:
```python
async with parse_semaphore:  # Max 3 concurrent
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        # Stream file in chunks
        while chunk := await file.read(8192):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(413, "File too large")
            temp_file.write(chunk)
        
        # Parse from temp file path
        result = await resume_parser.parse_file(
            temp_file.name,
            filename,
            is_file_path=True
        )
```

### Benefits
- Prevents OOM from large concurrent uploads
- Validates size early (fails fast)
- Allows processing files larger than available RAM

---

## Monitoring and Alerts

### Key Metrics to Monitor

**Audit Logs**:
- Table size (`pg_total_relation_size('audit_logs')`)
- Row count growth rate
- Oldest record age
- Cleanup job success/failure

**Resume Snapshots**:
- Average snapshot size
- Maximum snapshot size
- Number of oversized snapshots
- Compression ratio

**Performance**:
- Thread pool utilization
- Semaphore wait time
- Average task duration
- Memory usage during uploads

### Recommended Alerts
- Audit log table > 10GB
- Snapshot size > 1MB (investigate individual profiles)
- Thread pool queue depth > 10
- Semaphore wait time > 5 seconds

---

## Future Enhancements

1. **Object Storage Integration**: Move very large snapshots to S3/R2
2. **Delta Storage**: Store only changes between versions instead of full snapshots
3. **Background Jobs**: Implement scheduled cleanup using Celery/Arq
4. **Compression**: Use gzip compression for stored JSON snapshots
5. **Partitioning**: Implement time-based partitioning for audit_logs table
