using System.Text.Json;

namespace ArchSketch.Api.Services;

/// <summary>構成図リクエストの検証ルール（Business Logic Layer の一部）。</summary>
public static class DiagramValidation
{
    public const int MaxNameLength = 200;
    public const int MaxContentLengthChars = 8_000_000;

    /// <summary>検証エラーの一覧を返す（空リストなら妥当）。</summary>
    public static List<string> Validate(string? name, string? contentJson)
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

        return errors;
    }
}
