namespace ArchSketch.Api.Dtos;

/// <summary>API の入出力コントラクト（Presentation Layer と Service の境界で使用）。</summary>
public sealed record CreateDiagramRequest(string? Name, string? ContentJson);

public sealed record UpdateDiagramRequest(string? Name, string? ContentJson);

public sealed record DiagramDto(
    Guid Id,
    string Name,
    string ContentJson,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record DiagramSummaryDto(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    long ContentLengthChars);
