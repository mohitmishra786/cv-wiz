"""
Test snapshot size limits and validation.
"""

import pytest
from app.services.snapshot_limits import (
    SnapshotSizeValidator,
    SnapshotStorageManager,
    get_snapshot_storage_manager,
)


class TestSnapshotSizeValidator:
    """Tests for snapshot size validator."""
    
    def test_validate_small_snapshot(self):
        """Test validation of small snapshot within limits."""
        validator = SnapshotSizeValidator()
        
        snapshot = {
            "name": "John Doe",
            "email": "john@example.com",
            "experiences": [
                {"title": "Engineer", "company": "Tech Corp"}
            ],
        }
        
        result = validator.validate_snapshot(snapshot)
        
        assert result["valid"] is True
        assert len(result["warnings"]) == 0
        assert len(result["errors"]) == 0
    
    def test_validate_oversized_snapshot(self):
        """Test validation of oversized snapshot."""
        validator = SnapshotSizeValidator(max_size=1000)
        
        # Create snapshot larger than max_size
        large_snapshot = {
            "experiences": [
                {
                    "title": f"Engineer {i}",
                    "description": "x" * 100,
                }
                for i in range(100)
            ]
        }
        
        result = validator.validate_snapshot(large_snapshot)
        
        assert result["valid"] is False
        assert len(result["errors"]) > 0
        assert "exceeds maximum" in result["errors"][0]
    
    def test_validate_warning_size_snapshot(self):
        """Test validation of snapshot at warning threshold."""
        validator = SnapshotSizeValidator(
            max_size=100_000,
            warning_size=1000,  # Low threshold for testing
        )
        
        # Create snapshot between warning and max
        medium_snapshot = {
            "data": "x" * 1500,  # Between warning (1000) and max (100000)
        }
        
        result = validator.validate_snapshot(medium_snapshot)
        
        assert result["valid"] is True  # Under max
        assert len(result["warnings"]) > 0
        assert "large" in result["warnings"][0]
    
    def test_validate_long_arrays(self):
        """Test validation of snapshots with long arrays."""
        validator = SnapshotSizeValidator(max_array_length=5)
        
        snapshot = {
            "experiences": [{"title": f"Job {i}"} for i in range(10)]
        }
        
        result = validator.validate_snapshot(snapshot)
        
        assert result["valid"] is True  # Arrays don't invalidate unless oversized
        assert len(result["warnings"]) > 0
        assert "experiences" in result["warnings"][0]
    
    def test_truncate_snapshot(self):
        """Test snapshot truncation."""
        validator = SnapshotSizeValidator(max_array_length=3)
        
        snapshot = {
            "experiences": [
                {"title": f"Job {i}", "id": f"id{i}"}
                for i in range(10)
            ],
            "skills": [{"name": f"Skill {i}"} for i in range(10)],
        }
        
        truncated = validator.truncate_snapshot(snapshot)
        
        assert len(truncated["experiences"]) == 3
        assert len(truncated["skills"]) == 3
        # Should keep most recent (last 3)
        assert truncated["experiences"][0]["title"] == "Job 7"
    
    def test_compress_snapshot_metadata(self):
        """Test snapshot compression to metadata-only."""
        validator = SnapshotSizeValidator()
        
        snapshot = {
            "experiences": [
                {"id": f"exp{i}", "title": f"Job {i}", "order": i}
                for i in range(20)
            ],
            "name": "John Doe",
        }
        
        compressed = validator.compress_snapshot_metadata(snapshot)
        
        # Experiences should be compressed to IDs only
        assert len(compressed["experiences"]) == 10  # Limited to first 10
        assert "title" not in compressed["experiences"][0]
        assert "id" in compressed["experiences"][0]
        # Simple fields preserved
        assert compressed["name"] == "John Doe"


class TestSnapshotStorageManager:
    """Tests for snapshot storage manager."""
    
    def test_prepare_valid_snapshot(self):
        """Test preparing a valid snapshot for storage."""
        manager = SnapshotStorageManager()
        
        snapshot = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "experiences": [{"title": "Developer"}],
        }
        
        prepared, validation = manager.prepare_snapshot_for_storage(snapshot)
        
        assert validation["valid"] is True
        assert prepared == snapshot  # Unmodified if valid
    
    def test_prepare_oversized_snapshot(self):
        """Test preparing an oversized snapshot gets truncated."""
        manager = SnapshotStorageManager(max_size=500)
        
        large_snapshot = {
            "experiences": [
                {"title": f"Job {i}", "description": "x" * 100}
                for i in range(50)
            ]
        }
        
        prepared, validation = manager.prepare_snapshot_for_storage(large_snapshot)
        
        # Should be truncated to fit
        assert validation["valid"] is True  # After truncation
        assert len(prepared["experiences"]) < 50
    
    def test_prepare_with_force_compression(self):
        """Test force compression option."""
        manager = SnapshotStorageManager()
        
        snapshot = {
            "experiences": [
                {"id": f"exp{i}", "title": f"Job {i}"}
                for i in range(20)
            ],
        }
        
        prepared, validation = manager.prepare_snapshot_for_storage(
            snapshot,
            force_compression=True
        )
        
        assert validation.get("compressed") is True
        assert len(prepared["experiences"]) <= 10  # Limited by compression
    
    @pytest.mark.asyncio
    async def test_audit_snapshots(self):
        """Test auditing multiple snapshots."""
        manager = SnapshotStorageManager()
        
        snapshots = [
            {"data": "small"},  # Small
            {"data": "x" * 1000},  # Medium
            {"experiences": [{"id": i} for i in range(200)]},  # Large array
        ]
        
        results = await manager.audit_existing_snapshots(snapshots)
        
        assert results["total"] == 3
        assert "oversized" in results
        assert "warning_size" in results
        assert results["total_size_bytes"] > 0


class TestSnapshotStorageSingleton:
    """Tests for snapshot storage manager singleton."""
    
    def test_get_singleton_returns_same_instance(self):
        """Test that get_snapshot_storage_manager returns singleton."""
        manager1 = get_snapshot_storage_manager()
        manager2 = get_snapshot_storage_manager()
        
        assert manager1 is manager2
