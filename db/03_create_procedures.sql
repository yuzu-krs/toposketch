/* =============================================================================
 * ArchSketch - 03: ストアドプロシージャ（冪等 / CREATE OR ALTER）
 * ========================================================================== */
USE [ArchSketch];
GO

CREATE OR ALTER PROCEDURE dbo.usp_Diagrams_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id,
           Name,
           CreatedAtUtc,
           UpdatedAtUtc,
           DATALENGTH(ContentJson) / 2 AS ContentLengthChars
    FROM dbo.Diagram
    ORDER BY UpdatedAtUtc DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Diagrams_GetById
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, ContentJson, CreatedAtUtc, UpdatedAtUtc
    FROM dbo.Diagram
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Diagrams_Insert
    @Id          UNIQUEIDENTIFIER,
    @Name        NVARCHAR(200),
    @ContentJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Diagram (Id, Name, ContentJson)
    VALUES (@Id, @Name, @ContentJson);

    SELECT Id, Name, ContentJson, CreatedAtUtc, UpdatedAtUtc
    FROM dbo.Diagram
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Diagrams_Update
    @Id          UNIQUEIDENTIFIER,
    @Name        NVARCHAR(200),
    @ContentJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Diagram
       SET Name        = @Name,
           ContentJson = @ContentJson,
           UpdatedAtUtc = SYSUTCDATETIME()
     WHERE Id = @Id;

    IF @@ROWCOUNT = 0
    BEGIN
        ;THROW 50001, 'Diagram not found.', 1;
    END

    SELECT Id, Name, ContentJson, CreatedAtUtc, UpdatedAtUtc
    FROM dbo.Diagram
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Diagrams_Delete
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Diagram
    WHERE Id = @Id;

    SELECT @@ROWCOUNT AS DeletedCount;
END
GO
