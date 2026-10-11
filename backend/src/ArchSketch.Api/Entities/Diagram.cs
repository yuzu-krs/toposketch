namespace ArchSketch.Api.Entities;

/// <summary>構成図ドキュメントの DB エンティティ（Data Access Layer と Domain の表現）。</summary>
public sealed record Diagram(
    Guid Id,
    string Name,
    string ContentJson,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
