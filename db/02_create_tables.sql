/* =============================================================================
 * ArchSketch - 02: テーブル作成（冪等）
 * ========================================================================== */
USE [ArchSketch];
GO

IF OBJECT_ID(N'dbo.Diagram', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Diagram (
        Id            UNIQUEIDENTIFIER NOT NULL,
        Name          NVARCHAR(200)    NOT NULL,
        ContentJson   NVARCHAR(MAX)    NOT NULL,
        CreatedAtUtc  DATETIME2(3)     NOT NULL CONSTRAINT DF_Diagram_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedAtUtc  DATETIME2(3)     NOT NULL CONSTRAINT DF_Diagram_UpdatedAtUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Diagram PRIMARY KEY (Id)
    );

    CREATE INDEX IX_Diagram_UpdatedAtUtc
        ON dbo.Diagram (UpdatedAtUtc DESC);

    PRINT N'Created table dbo.Diagram.';
END
ELSE
BEGIN
    PRINT N'Table dbo.Diagram already exists.';
END
GO
