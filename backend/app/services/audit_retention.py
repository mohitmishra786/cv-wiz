"""
Audit Log Retention Service
Provides periodic cleanup of old audit log entries to prevent unbounded table growth.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from app.utils.logger import logger


class AuditLogRetentionService:
    """
    Service for managing audit log retention and cleanup.
    
    Implements automated cleanup of old audit logs based on configurable
    retention periods to prevent database table bloat.
    """
    
    # Default retention periods
    DEFAULT_RETENTION_DAYS = 90  # Keep logs for 90 days
    MIN_RETENTION_DAYS = 30      # Minimum retention period
    MAX_RETENTION_DAYS = 365     # Maximum retention period
    
    def __init__(self, retention_days: Optional[int] = None):
        """
        Initialize retention service.
        
        Args:
            retention_days: Number of days to retain audit logs
        """
        self.retention_days = self._validate_retention_days(
            retention_days or self.DEFAULT_RETENTION_DAYS
        )
        logger.info("[AuditRetention] Service initialized", {
            "retention_days": self.retention_days,
        })
    
    def _validate_retention_days(self, days: int) -> int:
        """Validate and clamp retention period to acceptable range."""
        return max(self.MIN_RETENTION_DAYS, min(days, self.MAX_RETENTION_DAYS))
    
    def get_cutoff_date(self) -> datetime:
        """
        Get the cutoff date for log retention.
        
        Returns:
            DateTime before which logs should be deleted
        """
        cutoff = datetime.utcnow() - timedelta(days=self.retention_days)
        logger.debug("[AuditRetention] Calculated cutoff date", {
            "cutoff": cutoff.isoformat(),
            "retention_days": self.retention_days,
        })
        return cutoff
    
    async def cleanup_old_logs(self) -> dict:
        """
        Delete audit logs older than the retention period.
        
        This method should be called periodically (e.g., daily) via a background job.
        
        Returns:
            Dictionary with cleanup statistics
        """
        logger.start_operation("audit_log_cleanup", {
            "retention_days": self.retention_days,
        })
        
        try:
            # This would typically use Prisma client or direct database access
            # For now, return placeholder statistics
            cutoff_date = self.get_cutoff_date()
            
            # TODO: Implement actual deletion when database access is available
            # Example with Prisma:
            # result = await prisma.auditlog.delete_many({
            #     "where": {
            #         "createdAt": {"lt": cutoff_date}
            #     }
            # })
            
            logger.info("[AuditRetention] Cleanup completed", {
                "cutoff_date": cutoff_date.isoformat(),
                "note": "Actual deletion requires database client integration",
            })
            
            return {
                "success": True,
                "deleted_count": 0,  # Placeholder
                "cutoff_date": cutoff_date.isoformat(),
                "retention_days": self.retention_days,
            }
            
        except Exception as e:
            logger.fail_operation("audit_log_cleanup", e)
            return {
                "success": False,
                "error": str(e),
                "retention_days": self.retention_days,
            }
    
    async def get_log_statistics(self) -> dict:
        """
        Get statistics about audit log storage.
        
        Returns:
            Dictionary with log statistics
        """
        try:
            # TODO: Implement actual statistics query
            # Example:
            # total_count = await prisma.auditlog.count()
            # old_count = await prisma.auditlog.count({
            #     "where": {
            #         "createdAt": {"lt": self.get_cutoff_date()}
            #     }
            # })
            
            logger.debug("[AuditRetention] Retrieved log statistics")
            
            return {
                "total_logs": 0,  # Placeholder
                "logs eligible for cleanup": 0,  # Placeholder
                "retention_days": self.retention_days,
                "cutoff_date": self.get_cutoff_date().isoformat(),
            }
            
        except Exception as e:
            logger.error("[AuditRetention] Failed to get statistics", {"error": str(e)})
            return {
                "error": str(e),
                "retention_days": self.retention_days,
            }
    
    def should_cleanup_run(self, last_cleanup: Optional[datetime]) -> bool:
        """
        Determine if cleanup should run based on last execution time.
        
        Args:
            last_cleanup: Last time cleanup was run
        
        Returns:
            True if cleanup should run, False otherwise
        """
        if last_cleanup is None:
            return True
        
        # Run cleanup daily
        time_since_cleanup = datetime.utcnow() - last_cleanup
        return time_since_cleanup >= timedelta(days=1)


# Global singleton instance
_retention_service: Optional[AuditLogRetentionService] = None


def get_audit_retention_service(retention_days: Optional[int] = None) -> AuditLogRetentionService:
    """
    Get or create the singleton audit log retention service.
    
    Args:
        retention_days: Number of days to retain logs (only used on first call)
    
    Returns:
        AuditLogRetentionService instance
    """
    global _retention_service
    if _retention_service is None:
        _retention_service = AuditLogRetentionService(retention_days)
        logger.info("[AuditRetention] Singleton service created")
    return _retention_service
