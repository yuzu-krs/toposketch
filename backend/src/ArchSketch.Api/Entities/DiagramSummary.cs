namespace ArchSketch.Api.Entities;

/// <summary>構成図の一覧表示用サマリエンティティ（JSON本文を含まない）。</summary>
public sealed record DiagramSummary(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    long ContentLengthChars);
