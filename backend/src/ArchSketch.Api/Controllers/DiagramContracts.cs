using System.Text.Json;

namespace ArchSketch.Api.Controllers;

/// <summary>API の入出力コントラクト。</summary>
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

/// <summary>リクエストの検証ルール。</summary>
public static class DiagramValidation
{
    public const int MaxNameLength = 200;
    public const int MaxContentLengthChars = 8_000_000;

    /// <summary>検証エラーの一覧を返す（空リストなら妥当）。</summary>
    public static List<string> Validate(string? name, string? contentJson, bool requireContent)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("name は必須です。");
        }
        else if (name.Trim().Length > MaxNameLength)
        {
            errors.Add($"name は {MaxNameLength} 文字以内で指定してください。");
        }

        if (requireContent)
        {
            if (string.IsNullOrWhiteSpace(contentJson))
            {
                errors.Add("contentJson は必須です。");
            }
            else if (contentJson.Length > MaxContentLengthChars)
            {
                errors.Add($"contentJson は {MaxContentLengthChars} 文字以内で指定してください。");
            }
            else
            {
                try
                {
                    using var _ = JsonDocument.Parse(contentJson);
                }
                catch (JsonException)
                {
                    errors.Add("contentJson が有効な JSON ではありません。");
                }
            }
        }

        return errors;
    }
}
