/* =============================================================================
 * ArchSketch - 01: データベース作成（冪等）
 * 実行方法: sqlcmd -S localhost -E -i 01_create_database.sql
 * ========================================================================== */
IF DB_ID(N'ArchSketch') IS NULL
BEGIN
    PRINT N'Creating database [ArchSketch] ...';
    CREATE DATABASE [ArchSketch];
END
ELSE
BEGIN
    PRINT N'Database [ArchSketch] already exists.';
END
GO
