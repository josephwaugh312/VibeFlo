import { Router } from 'express';
import {
  runSchemaSetup,
  runUsernameMigration,
  runBioMigration,
  runVerificationMigration,
  runThemeModerationMigration,
  runAuthTablesMigration,
  runThemeFixesMigration,
  runAllMigrations,
  runFullSchemaMigration,
  runFixAllTables
} from '../controllers/migration.controller';

const router = Router();

// Migration endpoints (secured by migration key)
router.get('/schema', runSchemaSetup);
router.get('/username', runUsernameMigration);
router.get('/bio', runBioMigration);
router.get('/verification', runVerificationMigration);
router.get('/theme-moderation', runThemeModerationMigration);
router.get('/auth-tables', runAuthTablesMigration);
router.get('/theme-fixes', runThemeFixesMigration);
router.get('/all', runAllMigrations);

// Updated routes to match available controller functions
router.post('/theme-fixes', runThemeFixesMigration);
router.post('/full-schema', runFullSchemaMigration);
router.post('/fix-all-tables', runFixAllTables);
router.get('/fix-all-tables', runFixAllTables);

export default router; 