"""
Snapshot Size Limits and Validation
Implements size limits and compression for resume snapshots to prevent unbounded storage growth.
"""

import json
from typing import Any, Dict, Optional

from app.utils.logger import logger


class SnapshotSizeValidator:
    """
    Validates and enforces size limits on resume snapshots.
    
    Prevents unbounded JSON growth by enforcing size limits and
    recommending optimization strategies.
    """
    
    # Size limits (in bytes for JSON string)
    MAX_SNAPSHOT_SIZE = 512_000  # 512 KB
    WARNING_SNAPSHOT_SIZE = 256_000  # 256 KB
    MAX_ARRAY_LENGTH = 100  # Maximum items in arrays
    
    def __init__(
        self,
        max_size: int = MAX_SNAPSHOT_SIZE,
        warning_size: int = WARNING_SNAPSHOT_SIZE,
        max_array_length: int = MAX_ARRAY_LENGTH,
    ):
        """
        Initialize validator with size limits.
        
        Args:
            max_size: Maximum allowed snapshot size in bytes
            warning_size: Size threshold for warnings
            max_array_length: Maximum items in arrays
        """
        self.max_size = max_size
        self.warning_size = warning_size
        self.max_array_length = max_array_length
        logger.debug("[SnapshotValidator] Initialized", {
            "max_size": max_size,
            "warning_size": warning_size,
        })
    
    def validate_snapshot(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate snapshot size and structure.
        
        Args:
            snapshot: Resume snapshot data
        
        Returns:
            Validation result with warnings/errors
        """
        result = {
            "valid": True,
            "warnings": [],
            "errors": [],
            "size_bytes": 0,
            "recommendations": [],
        }
        
        try:
            # Serialize to JSON to check size
            json_str = json.dumps(snapshot, default=str)
            size_bytes = len(json_str.encode('utf-8'))
            result["size_bytes"] = size_bytes
            
            # Check size limits
            if size_bytes > self.max_size:
                result["valid"] = False
                result["errors"].append(
                    f"Snapshot size ({size_bytes:,} bytes) exceeds maximum ({self.max_size:,} bytes)"
                )
                result["recommendations"].append("Remove old or unnecessary resume versions")
            
            elif size_bytes > self.warning_size:
                result["warnings"].append(
                    f"Snapshot size ({size_bytes:,} bytes) is large"
                )
                result["recommendations"].append("Consider archiving old resume versions")
            
            # Check array lengths
            for key, value in snapshot.items():
                if isinstance(value, list) and len(value) > self.max_array_length:
                    result["warnings"].append(
                        f"Array '{key}' has {len(value)} items (max recommended: {self.max_array_length})"
                    )
                    result["recommendations"].append(f"Trim {key} to most recent entries")
            
            # Log validation results
            if result["errors"]:
                logger.warning("[SnapshotValidator] Validation failed", {
                    "size_bytes": size_bytes,
                    "errors": result["errors"],
                })
            elif result["warnings"]:
                logger.info("[SnapshotValidator] Validation warnings", {
                    "size_bytes": size_bytes,
                    "warnings": result["warnings"],
                })
            else:
                logger.debug("[SnapshotValidator] Validation passed", {
                    "size_bytes": size_bytes,
                })
            
            return result
            
        except Exception as e:
            logger.error("[SnapshotValidator] Validation error", {"error": str(e)})
            result["valid"] = False
            result["errors"].append(f"Validation error: {str(e)}")
            return result
    
    def truncate_snapshot(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Truncate snapshot to fit within size limits.
        
        Keeps most recent items and truncates long arrays.
        
        Args:
            snapshot: Resume snapshot data
        
        Returns:
            Truncated snapshot
        """
        truncated = snapshot.copy()
        truncation_count = 0
        
        for key, value in truncated.items():
            if isinstance(value, list) and len(value) > self.max_array_length:
                # Keep most recent items
                original_length = len(value)
                truncated[key] = value[-self.max_array_length:]
                truncation_count += original_length - len(truncated[key])
                
                logger.info("[SnapshotValidator] Truncated array", {
                    "key": key,
                    "original_length": original_length,
                    "new_length": len(truncated[key]),
                })
        
        if truncation_count > 0:
            logger.warning("[SnapshotValidator] Snapshot truncated", {
                "items_removed": truncation_count,
            })
        
        return truncated
    
    def compress_snapshot_metadata(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create compressed metadata-only version of snapshot.
        
        Stores only IDs and essential metadata instead of full data.
        
        Args:
            snapshot: Full resume snapshot
        
        Returns:
            Compressed metadata snapshot
        """
        compressed = {}
        
        for key, value in snapshot.items():
            if isinstance(value, list):
                # Store only IDs and minimal metadata
                compressed[key] = [
                    {"id": item.get("id"), "order": item.get("order")}
                    if isinstance(item, dict) else item
                    for item in value[:10]  # Limit to first 10
                ]
            elif isinstance(value, dict):
                compressed[key] = {"id": value.get("id")}
            else:
                compressed[key] = value
        
        logger.debug("[SnapshotValidator] Created compressed metadata", {
            "original_keys": list(snapshot.keys()),
            "compressed_keys": list(compressed.keys()),
        })
        
        return compressed


class SnapshotStorageManager:
    """
    Manages snapshot storage with size limits and compression strategies.
    """
    
    def __init__(self, max_size: int = SnapshotSizeValidator.MAX_SNAPSHOT_SIZE):
        """
        Initialize storage manager.
        
        Args:
            max_size: Maximum snapshot size in bytes
        """
        self.validator = SnapshotSizeValidator(max_size=max_size)
        logger.info("[SnapshotStorage] Manager initialized", {"max_size": max_size})
    
    def prepare_snapshot_for_storage(
        self,
        snapshot: Dict[str, Any],
        force_compression: bool = False,
    ) -> tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Prepare snapshot for storage with validation and optimization.
        
        Args:
            snapshot: Resume snapshot data
            force_compression: Force compression even if size is acceptable
        
        Returns:
            Tuple of (prepared_snapshot, validation_result)
        """
        # Validate snapshot
        validation = self.validator.validate_snapshot(snapshot)
        
        # If too large, truncate
        if not validation["valid"]:
            logger.warning("[SnapshotStorage] Snapshot too large, truncating", {
                "size_bytes": validation["size_bytes"],
            })
            snapshot = self.validator.truncate_snapshot(snapshot)
            validation = self.validator.validate_snapshot(snapshot)
        
        # Optionally compress to metadata-only
        if force_compression or validation["size_bytes"] > self.validator.warning_size:
            logger.info("[SnapshotStorage] Compressing snapshot to metadata", {
                "size_bytes": validation["size_bytes"],
            })
            snapshot = self.validator.compress_snapshot_metadata(snapshot)
            validation = self.validator.validate_snapshot(snapshot)
            validation["compressed"] = True
        
        return snapshot, validation
    
    async def audit_existing_snapshots(self, snapshots: list) -> Dict[str, Any]:
        """
        Audit existing snapshots for size compliance.
        
        Args:
            snapshots: List of snapshots to audit
        
        Returns:
            Audit results with statistics
        """
        results = {
            "total": len(snapshots),
            "oversized": 0,
            "warning_size": 0,
            "total_size_bytes": 0,
            "recommendations": [],
        }
        
        for snapshot in snapshots:
            if isinstance(snapshot, dict):
                validation = self.validator.validate_snapshot(snapshot)
                results["total_size_bytes"] += validation["size_bytes"]
                
                if not validation["valid"]:
                    results["oversized"] += 1
                elif validation["warnings"]:
                    results["warning_size"] += 1
        
        if results["oversized"] > 0:
            results["recommendations"].append(
                f"{results['oversized']} snapshots exceed size limits - consider archival"
            )
        
        if results["warning_size"] > 0:
            results["recommendations"].append(
                f"{results['warning_size']} snapshots are large - monitor growth"
            )
        
        logger.info("[SnapshotStorage] Audit completed", results)
        
        return results


# Global singleton
_storage_manager: Optional[SnapshotStorageManager] = None


def get_snapshot_storage_manager() -> SnapshotStorageManager:
    """Get or create the singleton snapshot storage manager."""
    global _storage_manager
    if _storage_manager is None:
        _storage_manager = SnapshotStorageManager()
        logger.info("[SnapshotStorage] Singleton manager created")
    return _storage_manager
