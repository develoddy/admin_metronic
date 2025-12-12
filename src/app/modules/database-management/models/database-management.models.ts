export interface DatabaseStatus {
  success: boolean;
  database: {
    connected: boolean;
    name: string;
    host: string;
    dialect: string;
    environment: string;
  };
  tables: {
    count: number;
    list: string[];
  };
  migrations: {
    available: boolean;
    lastMigrations?: string[];
    error?: string;
  };
  permissions: {
    canReset: boolean;
    environment: string;
    prodResetAllowed: boolean;
  };
  checkedAt: string;
}

export interface DatabaseResetRequest {
  confirmReset: boolean;
  confirmText: string;
  createBackupFirst: boolean;
  reason: string;
  adminPassword?: string;
}

export interface DatabaseResetResponse {
  success: boolean;
  message: string;
  operation: string;
  executedAt: string;
  environment: string;
  user: string;
  backupCreated: boolean;
  backupFilename?: string;
  tablesRecreated: boolean;
  reason: string;
  error?: string;
}

export interface MigrationRequest {
  confirmMigrations: boolean;
}

export interface MigrationResponse {
  success: boolean;
  message: string;
  output?: string;
  warnings?: string;
  executedAt: string;
  error?: string;
}

export interface RollbackRequest {
  confirmRollback: boolean;
}

export interface DatabaseOperation {
  type: 'reset' | 'migrate' | 'rollback' | 'status' | 'seed';
  isLoading: boolean;
  error: string | null;
  success: boolean;
  lastResult: any;
}

export interface MigrationsStatusResponse {
  success: boolean;
  pendingMigrations: Migration[];
  executedMigrations: Migration[];
  totalPending: number;
  totalExecuted: number;
  environment: string;
  checkedAt: string;
}

export interface Migration {
  name: string;
  status: 'pending' | 'executed';
}

export interface SeedersStatusResponse {
  success: boolean;
  availableSeeders: Seeder[];
  executedSeeders: Seeder[];
  totalSeeders: number;
  seedersDirectory: string;
  environment: string;
  checkedAt: string;
}

export interface Seeder {
  name: string;
  path: string;
  status: 'available' | 'executed';
  executedAt?: string;
  size: number;
  modified: Date;
}

export interface SeederRequest {
  confirmSeeders: boolean;
}

export interface DatabaseManagementState {
  status: DatabaseStatus | null;
  operation: DatabaseOperation;
  lastReset: DatabaseResetResponse | null;
  lastMigration: MigrationResponse | null;
}

// Para integración con el módulo de backups existente
export interface BackupIntegration {
  createBackupBeforeReset: boolean;
  backupService: any; // Referencia al BackupsService existente
}

// Configuración de seguridad
export interface SecurityConfig {
  requireSuperAdmin: boolean;
  requireConfirmationText: boolean;
  requiredConfirmationText: string;
  allowInProduction: boolean;
  createBackupByDefault: boolean;
}