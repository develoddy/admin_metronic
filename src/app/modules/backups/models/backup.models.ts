export interface Backup {
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string | Date;
  modifiedAt: string | Date;
  backupDate: string | null;
  path: string;
}

export interface BackupListResponse {
  success: boolean;
  message: string;
  backups: Backup[];
  totalBackups: number;
  totalSize: number;
  directory: string;
}

export interface BackupStatusResponse {
  success: boolean;
  status: {
    backupsDirectoryExists: boolean;
    backupScriptExists: boolean;
    cronConfigured: boolean;
    cronSchedule: string | null;
    nextExecution: string | null;
    lastBackup: {
      filename: string;
      createdAt: string | Date;
    } | null;
    backupsDirectory: string;
    scriptPath: string;
    cronEntriesCount?: number;
    hasDuplicates?: boolean;
    needsCleanup?: boolean;
  };
}

export interface BackupActionResponse {
  success: boolean;
  message: string;
  filename?: string;
  database?: string;
  restoredAt?: string;
  createdAt?: string;
  deletedAt?: string;
  output?: string;
  error?: string;
  details?: string;
}

export interface RestoreRequest {
  filename: string;
  confirmRestore: boolean;
}

export interface DeleteRequest {
  confirmDelete: boolean;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  oldestBackup: Backup | null;
  newestBackup: Backup | null;
  averageSize: number;
  averageSizeFormatted: string;
}

export interface BackupOperationStatus {
  isLoading: boolean;
  operation: 'list' | 'download' | 'restore' | 'create' | 'delete' | 'status' | 'setup' | 'logs' | 'cleanup' | null;
  error: string | null;
  success: boolean;
}

export interface BackupLogsResponse {
  success: boolean;
  message: string;
  logs: string[];
  logFile: string;
  totalLines?: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  details?: string;
  output?: string;
  configuredAt?: string;
  error?: string;
}